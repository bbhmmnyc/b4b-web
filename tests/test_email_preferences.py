import asyncio
import os
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "blogs4blocks-test")

from routes import auth, profile  # noqa: E402
from models import EmailPrefsUpdate, UserCreate  # noqa: E402
import email_service  # noqa: E402


class FakePrefs:
    def __init__(self, value=None):
        self.value = value
        self.updated = None

    async def find_one(self, *_args, **_kwargs):
        return self.value

    async def update_one(self, *_args, **kwargs):
        self.updated = kwargs


class FakeProfileDb:
    def __init__(self, prefs=None):
        self.user_prefs = FakePrefs(prefs)


def test_existing_users_default_to_new_post_emails(monkeypatch):
    monkeypatch.setattr(profile, "db", FakeProfileDb())

    result = asyncio.run(profile.get_email_prefs({"id": "legacy-user"}))

    assert result == {"email_new_posts": True, "email_digest": True}


def test_email_preference_update_preserves_unrelated_fields(monkeypatch):
    fake_db = FakeProfileDb({"user_id": "user-1", "my_posts_color": "#123456", "email_digest": True})
    monkeypatch.setattr(profile, "db", fake_db)

    result = asyncio.run(
        profile.update_email_prefs(
            EmailPrefsUpdate(email_new_posts=False),
            {"id": "user-1"},
        )
    )

    assert result == {"email_new_posts": False, "email_digest": True}
    assert fake_db.user_prefs.updated["upsert"] is True


def test_new_registration_starts_opted_out(monkeypatch):
    class FakeCollection:
        def __init__(self):
            self.inserted = []

        async def find_one(self, *_args, **_kwargs):
            return None

        async def insert_one(self, document):
            self.inserted.append(document)

    class FakeAuthDb:
        def __init__(self):
            self.users = FakeCollection()
            self.user_prefs = FakeCollection()

    class FakeLimiter:
        def check(self, *_args, **_kwargs):
            return None

    fake_db = FakeAuthDb()
    monkeypatch.setattr(auth, "db", fake_db)
    monkeypatch.setattr(auth, "auth_limiter", FakeLimiter())
    monkeypatch.setattr(auth, "hash_password", lambda _password: "hashed")
    monkeypatch.setattr(auth, "create_token", lambda _user_id: "token")

    async def skip_verification(_user_doc):
        return None

    monkeypatch.setattr(auth, "_send_verification_email", skip_verification)

    asyncio.run(
        auth.register(
            UserCreate(
                name="New User",
                email="new-user@example.com",
                password="password123",
                city="Boston",
                country="United States",
            ),
            None,
        )
    )

    assert fake_db.user_prefs.inserted[0]["email_new_posts"] is False


def test_new_post_notifications_skip_opted_out_users_and_author(monkeypatch):
    class FakeUsers:
        def find(self, *_args, **_kwargs):
            return self

        async def to_list(self, _limit):
            return [
                {"id": "author", "email": "author@example.com", "name": "Author"},
                {"id": "opted-out", "email": "out@example.com", "name": "Opted Out"},
                {"id": "recipient", "email": "recipient@example.com", "name": "Recipient"},
            ]

    class FakePrefsCollection:
        def find(self, *_args, **_kwargs):
            return self

        async def to_list(self, _limit):
            return [{"user_id": "opted-out"}]

    class FakeDb:
        users = FakeUsers()
        user_prefs = FakePrefsCollection()

    sent = []

    async def fake_send(to_email, subject, html_content, headers=None):
        sent.append(to_email)

    monkeypatch.setattr(email_service, "db", FakeDb())
    monkeypatch.setattr(email_service, "send_email_notification", fake_send)

    asyncio.run(email_service.notify_new_post_to_all_users({
        "id": "post-1",
        "author_id": "author",
        "title": "A post",
        "excerpt": "An excerpt",
        "author_name": "Author",
        "author_city": "Boston",
    }))

    assert sent == ["recipient@example.com"]

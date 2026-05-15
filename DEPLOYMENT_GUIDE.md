# Blogs 4 Blocks — Oracle Cloud Deployment Guide
## Ubuntu (AMD) — Always Free Tier

This guide walks you through deploying Blogs 4 Blocks on an **Oracle Cloud Infrastructure (OCI) Always Free** AMD instance running **Ubuntu**. The Always Free tier includes up to 2x **VM.Standard.E2.1.Micro** instances (1 OCPU, 1 GB RAM each) with 200 GB total block storage — plenty for a production blog.

---

## Prerequisites

- An **Oracle Cloud** account ([sign up free](https://www.oracle.com/cloud/free/))
- A domain name (e.g., `blogs4blocks.com`) pointed to your instance's public IP
- An SSH key pair on your local machine
- A **MongoDB Atlas** free cluster ([create one here](https://www.mongodb.com/atlas)) — recommended over local MongoDB to save RAM on the micro instance

---

## Step 1: Create an Always Free Ubuntu AMD Instance

1. Log in to the [OCI Console](https://cloud.oracle.com/)
2. Navigate to **Compute → Instances → Create Instance**
3. Configure:
   - **Name:** `blogs4blocks`
   - **Image:** Ubuntu 22.04 or 24.04 (look for the "Always Free eligible" tag)
   - **Shape:** `VM.Standard.E2.1.Micro` (AMD, 1 OCPU, 1 GB RAM) — marked **Always Free**
   - **Boot volume:** 50 GB (fits within the 200 GB free limit)
   - **Networking:** Create or select a VCN with a public subnet; **assign a public IP**
   - **SSH keys:** Upload your public key (e.g., `~/.ssh/id_rsa.pub`)
4. Click **Create** and wait for the instance to reach **Running** state
5. Note the **Public IP Address** from the instance details page

---

## Step 2: Configure OCI Security Lists (Firewall)

OCI blocks all inbound traffic by default. You need to open ports for HTTP, HTTPS, and SSH.

1. In the OCI Console, go to **Networking → Virtual Cloud Networks**
2. Click your VCN → click your **public subnet** → click the **Security List**
3. Add **Ingress Rules**:

| Source CIDR   | Protocol | Dest Port | Description       |
|---------------|----------|-----------|-------------------|
| `0.0.0.0/0`  | TCP      | 22        | SSH               |
| `0.0.0.0/0`  | TCP      | 80        | HTTP              |
| `0.0.0.0/0`  | TCP      | 443       | HTTPS             |

---

## Step 3: SSH into Your Instance

```bash
ssh -i ~/.ssh/id_rsa ubuntu@YOUR_PUBLIC_IP
```

> **Note:** On Oracle Cloud Ubuntu instances, the default user is `ubuntu`, not `root`. Use `sudo` for admin commands.

---

## Step 4: Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Yarn (package manager for frontend)
sudo npm install -g yarn

# Install Python 3 + venv
sudo apt install -y python3 python3-pip python3-venv

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install Certbot for free SSL certificates
sudo apt install -y certbot python3-certbot-nginx

# Install Git
sudo apt install -y git
```

### (Optional) Add Swap Space

The micro instance has only 1 GB RAM. Adding swap prevents out-of-memory crashes during builds:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Step 5: Configure Ubuntu Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

When prompted, type `y` to confirm.

---

## Step 6: Clone Your Code

```bash
sudo mkdir -p /var/www/blogs4blocks
sudo chown ubuntu:ubuntu /var/www/blogs4blocks
cd /var/www/blogs4blocks

# Option 1: Git clone (recommended)
git clone <your-repo-url> .

# Option 2: SCP from your local machine
# scp -i ~/.ssh/id_rsa -r /path/to/app/* ubuntu@YOUR_PUBLIC_IP:/var/www/blogs4blocks/
```

---

## Step 7: Setup Backend

```bash
cd /var/www/blogs4blocks/backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Create the backend `.env` file:

```bash
cat > .env << 'EOF'
MONGO_URL=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net
DB_NAME=blogs4blocks
JWT_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_STRING
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RESEND_API_KEY=your_resend_api_key
SENDER_EMAIL=noreply@yourdomain.com
ADMIN_SETUP_KEY=your-secure-admin-setup-key
EOF
```

> **Important:** Replace all placeholder values. For `JWT_SECRET`, generate one with: `openssl rand -hex 32`

### Quick test:

```bash
uvicorn server:app --host 0.0.0.0 --port 8001
# If you see "Uvicorn running on http://0.0.0.0:8001", it works. Ctrl+C to stop.
```

---

## Step 8: Build Frontend

```bash
cd /var/www/blogs4blocks/frontend

# Create production .env
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://yourdomain.com
EOF

# Install dependencies and build
yarn install
yarn build
# This creates a 'build/' folder with optimized static files
```

> **Tip:** If the build runs out of memory on the micro instance, the swap from Step 4 will help. You can also set `NODE_OPTIONS=--max-old-space-size=512` before running `yarn build`.

---

## Step 9: Configure Nginx

```bash
sudo tee /etc/nginx/sites-available/blogs4blocks << 'NGINX'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend — serve React static build
    root /var/www/blogs4blocks/frontend/build;
    index index.html;

    # API reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }

    # Uploaded files
    location /api/uploads/ {
        proxy_pass http://127.0.0.1:8001;
    }

    # WebSocket support for real-time comments
    location /api/ws/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # React Router — serve index.html for all client-side routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX

# Enable the site and remove the default
sudo ln -sf /etc/nginx/sites-available/blogs4blocks /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test config and restart
sudo nginx -t && sudo systemctl restart nginx
```

---

## Step 10: Enable SSL (HTTPS)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certbot will automatically configure Nginx for HTTPS and set up auto-renewal.

Verify auto-renewal works:

```bash
sudo certbot renew --dry-run
```

---

## Step 11: Create a Systemd Service for the Backend

This ensures the backend starts automatically on boot and restarts on crash:

```bash
sudo tee /etc/systemd/system/blogs4blocks.service << 'SERVICE'
[Unit]
Description=Blogs 4 Blocks Backend (FastAPI)
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/blogs4blocks/backend
Environment=PATH=/var/www/blogs4blocks/backend/venv/bin:/usr/local/bin:/usr/bin
ExecStart=/var/www/blogs4blocks/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable blogs4blocks
sudo systemctl start blogs4blocks

# Verify it's running
sudo systemctl status blogs4blocks
```

---

## Step 12: Verify Everything Works

1. Visit `https://yourdomain.com` — you should see the homepage
2. Visit `https://yourdomain.com/api/stats` — should return JSON stats
3. Register a new account through the UI
4. Navigate to `https://yourdomain.com/admin-setup` and enter your `ADMIN_SETUP_KEY` to become admin

---

## MongoDB Atlas Setup (Recommended)

Running MongoDB locally on a 1 GB RAM micro instance is tight. MongoDB Atlas free tier (M0) gives you a 512 MB cloud database with automatic backups.

1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Under **Database Access**, create a database user
4. Under **Network Access**, add your Oracle Cloud instance's public IP (or `0.0.0.0/0` for testing)
5. Click **Connect** → **Drivers** → copy the connection string
6. Update your backend `.env`:
   ```
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net
   DB_NAME=blogs4blocks
   ```
7. Restart the backend: `sudo systemctl restart blogs4blocks`

### (Alternative) Install MongoDB Locally

If you prefer local MongoDB:

```bash
# Import MongoDB GPG key and repository
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start and enable
sudo systemctl start mongod
sudo systemctl enable mongod

# Update backend .env
# MONGO_URL=mongodb://localhost:27017
```

---

## Maintenance Commands

```bash
# View backend logs (live)
sudo journalctl -u blogs4blocks -f

# Restart backend
sudo systemctl restart blogs4blocks

# Restart Nginx
sudo systemctl restart nginx

# Check service status
sudo systemctl status blogs4blocks
sudo systemctl status nginx

# Update code and redeploy
cd /var/www/blogs4blocks
git pull

# Rebuild backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart blogs4blocks

# Rebuild frontend
cd ../frontend
yarn install
yarn build
# Frontend updates are instant — Nginx serves the new build files
```

---

## Weekly Digest Cron Job

To automatically trigger the weekly digest email every Monday at 9 AM:

```bash
crontab -e
# Add this line:
0 9 * * 1 curl -s -X POST http://127.0.0.1:8001/api/admin/send-digest -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Performance Tips for the Micro Instance

- **Use MongoDB Atlas** instead of local MongoDB to save ~300 MB RAM
- **Add 2 GB swap** (Step 4) to handle build spikes and prevent OOM kills
- **Use 1 Uvicorn worker** if RAM is tight: change `--workers 2` to `--workers 1` in the systemd service
- **Enable gzip** in Nginx for faster page loads:
  ```nginx
  # Add to the server block or http block in /etc/nginx/nginx.conf
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml;
  gzip_min_length 1000;
  ```
- **Monitor memory:** `free -h` and `htop` (install with `sudo apt install htop`)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **502 Bad Gateway** | Backend isn't running. Check `sudo systemctl status blogs4blocks` and `sudo journalctl -u blogs4blocks -n 50` |
| **Can't reach site at all** | Check OCI Security List ingress rules (Step 2) and UFW status (`sudo ufw status`) |
| **WebSocket errors** | Ensure Nginx config includes WebSocket upgrade headers (see Step 9) |
| **CORS errors** | Update `CORS_ORIGINS` in backend `.env` with your exact domain |
| **Build runs out of memory** | Add swap (Step 4) and/or set `NODE_OPTIONS=--max-old-space-size=512` |
| **Images not loading** | Check Nginx is proxying `/api/uploads/` correctly |
| **SSL certificate not renewing** | Run `sudo certbot renew --dry-run` to diagnose; check cron: `sudo systemctl status certbot.timer` |

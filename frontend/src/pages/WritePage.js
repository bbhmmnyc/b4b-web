import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { PenLine, Send, AlertCircle, ImagePlus, X, Plus, Lightbulb, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import RichTextEditor from '../components/RichTextEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select';
import { toast } from 'sonner';

export default function WritePage() {
  const { user, token, categories, API } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category_slug: '',
    subcategory: '',
    tags: '',
  });
  const [guestData, setGuestData] = useState({
    name: '',
    city: '',
    country: '',
  });
  const [subcategories, setSubcategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef(null);
  const [showSuggestDialog, setShowSuggestDialog] = useState(false);
  const [suggestName, setSuggestName] = useState('');
  const [suggestDesc, setSuggestDesc] = useState('');
  const [suggestSubmitting, setSuggestSubmitting] = useState(false);
  const [partners, setPartners] = useState([]);
  const [selectedCoAuthors, setSelectedCoAuthors] = useState([]);

  useEffect(() => {
    if (user && token) {
      axios.get(`${API}/partners`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setPartners(res.data))
        .catch(() => {});
    }
  }, [user, token, API]);

  useEffect(() => {
    if (editId && token) {
      setIsEditing(true);
      axios.get(`${API}/posts/${editId}`).then(res => {
        const p = res.data;
        setFormData({
          title: p.title || '',
          excerpt: p.excerpt || '',
          content: p.content || '',
          category_slug: p.category_slug || '',
          subcategory: p.subcategory || '',
          tags: (p.tags || []).join(', '),
        });
        if (p.cover_image) setCoverImage(p.cover_image);
        if (p.co_authors?.length) setSelectedCoAuthors(p.co_authors.map(ca => ca.id));
        if (p.category_slug) {
          axios.get(`${API}/categories/${p.category_slug}`).then(r => setSubcategories(r.data.subcategories || [])).catch(() => {});
        }
      }).catch(() => { toast.error('Failed to load post for editing'); });
    }
  }, [editId, token, API]);

  const handleSuggestTopic = async () => {
    if (!suggestName.trim() || !suggestDesc.trim()) return;
    setSuggestSubmitting(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API}/categories/suggest`, {
        name: suggestName.trim(),
        description: suggestDesc.trim()
      }, { headers });
      toast.success('Topic suggested! It will appear once reviewed.');
      setShowSuggestDialog(false);
      setSuggestName('');
      setSuggestDesc('');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to suggest topic');
    }
    setSuggestSubmitting(false);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${API}/upload`, formData);
      setCoverImage(res.data.url);
    } catch (err) {
      setError('Failed to upload cover image. Max size is 5MB.');
    }
    setCoverUploading(false);
    e.target.value = '';
  };

  const handleCategoryChange = async (value) => {
    setFormData(prev => ({ ...prev, category_slug: value, subcategory: '' }));
    try {
      const res = await axios.get(`${API}/categories/${value}`);
      setSubcategories(res.data.subcategories || []);
    } catch (e) {
      setSubcategories([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.content.trim() || !formData.category_slug || !formData.excerpt.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!user && (!guestData.name.trim() || !guestData.city.trim())) {
      setError('Guest posts require your name and city.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        subcategory: formData.subcategory || null,
        cover_image: coverImage,
        co_authors: selectedCoAuthors,
      };

      if (!user) {
        payload.guest_author = {
          name: guestData.name.trim(),
          city: guestData.city.trim(),
          country: guestData.country.trim() || 'Unknown',
        };
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      if (isEditing && editId) {
        await axios.put(`${API}/posts/${editId}`, payload, { headers });
        toast.success('Post updated!');
        navigate(`/post/${editId}`);
      } else {
        const res = await axios.post(`${API}/posts`, payload, { headers });
        toast.success('Your post has been published!');
        navigate(`/post/${res.data.id}`);
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to publish. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen" data-testid="write-page">
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-12 md:py-20">
        <div className="mb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-grey mb-4">
            {isEditing ? 'Editing' : 'New Post'}
          </p>
          <h1 className="font-heading font-bold text-3xl md:text-4xl tracking-tight text-[#1A1A1A] mb-2" data-testid="write-heading">
            {isEditing ? 'Edit Your Post' : 'Share Your Marketing Insight'}
          </h1>
          <p className="text-base text-brand-grey">
            {isEditing ? 'Update your post with the latest insights.' : 'Your experience matters. Share what works in your market.'}
          </p>
        </div>

        {/* Guest notice */}
        {!user && (
          <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-5 mb-8 flex items-start gap-3" data-testid="write-guest-notice">
            <AlertCircle className="w-5 h-5 text-[#92400E] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#92400E]">Posting as a guest</p>
              <p className="text-xs text-[#92400E]/70 mt-0.5">Guest posts are active for 30 days. <a href="/auth" className="underline font-semibold">Sign up</a> for a permanent presence!</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8" data-testid="write-form">
          {/* Guest fields */}
          {!user && (
            <div className="bg-white border border-[#E5E5E5] p-6 space-y-4">
              <h3 className="font-heading font-bold text-base uppercase tracking-wider">About You</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="guest-name" className="text-xs font-bold uppercase tracking-wider text-brand-grey">Name *</Label>
                  <Input id="guest-name" placeholder="Your name" value={guestData.name} onChange={(e) => setGuestData(prev => ({ ...prev, name: e.target.value }))} className="mt-2 border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none" data-testid="write-guest-name" />
                </div>
                <div>
                  <Label htmlFor="guest-city" className="text-xs font-bold uppercase tracking-wider text-brand-grey">City *</Label>
                  <Input id="guest-city" placeholder="Your city" value={guestData.city} onChange={(e) => setGuestData(prev => ({ ...prev, city: e.target.value }))} className="mt-2 border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none" data-testid="write-guest-city" />
                </div>
                <div>
                  <Label htmlFor="guest-country" className="text-xs font-bold uppercase tracking-wider text-brand-grey">Country</Label>
                  <Input id="guest-country" placeholder="Your country" value={guestData.country} onChange={(e) => setGuestData(prev => ({ ...prev, country: e.target.value }))} className="mt-2 border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none" data-testid="write-guest-country" />
                </div>
              </div>
            </div>
          )}

          {/* Post content */}
          <div className="bg-white border border-[#E5E5E5] p-6 space-y-6">
            <h3 className="font-heading font-bold text-base uppercase tracking-wider">Your Post</h3>

            {/* Cover Image Upload */}
            <div data-testid="cover-image-section">
              <Label className="text-xs font-bold uppercase tracking-wider text-brand-grey">Cover Image</Label>
              {coverImage ? (
                <div className="relative mt-2 overflow-hidden border border-[#E5E5E5]">
                  <img src={`${process.env.REACT_APP_BACKEND_URL}${coverImage}`} alt="Cover" className="w-full h-48 object-cover" data-testid="cover-image-preview" />
                  <button type="button" onClick={() => setCoverImage(null)} className="absolute top-2 right-2 bg-[#1A1A1A]/60 hover:bg-[#1A1A1A]/80 text-white p-1.5 transition-colors" data-testid="cover-image-remove">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => coverInputRef.current?.click()} disabled={coverUploading} className="mt-2 w-full border border-dashed border-[#E5E5E5] hover:border-[#1A1A1A] py-10 flex flex-col items-center gap-2 text-brand-grey hover:text-[#1A1A1A] transition-colors" data-testid="cover-image-upload-btn">
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase tracking-widest">{coverUploading ? 'Uploading...' : 'Add Cover Image'}</span>
                </button>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" data-testid="cover-image-file-input" />
            </div>

            <div>
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-brand-grey">Title *</Label>
              <Input id="title" placeholder="A compelling title for your marketing insight..." value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} className="mt-2 border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none text-lg h-12" data-testid="write-title" />
            </div>

            <div>
              <Label htmlFor="excerpt" className="text-xs font-bold uppercase tracking-wider text-brand-grey">Short Summary *</Label>
              <Input id="excerpt" placeholder="One-liner that hooks the reader..." value={formData.excerpt} onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))} className="mt-2 border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none" data-testid="write-excerpt" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-brand-grey">Category *</Label>
                <Select value={formData.category_slug} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="mt-2 border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none" data-testid="write-category-select">
                    <SelectValue placeholder="Choose a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.slug} value={cat.slug} data-testid={`write-cat-option-${cat.slug}`}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {subcategories.length > 0 && (
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-brand-grey">Subtopic</Label>
                  <Select value={formData.subcategory} onValueChange={(v) => setFormData(prev => ({ ...prev, subcategory: v }))}>
                    <SelectTrigger className="mt-2 border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none" data-testid="write-subcategory-select">
                      <SelectValue placeholder="Optional subtopic" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map(sub => (
                        <SelectItem key={sub.slug} value={sub.slug} data-testid={`write-sub-option-${sub.slug}`}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <button type="button" onClick={() => setShowSuggestDialog(true)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-grey hover:text-[#1A1A1A] transition-colors" data-testid="suggest-topic-btn">
              <Lightbulb className="w-4 h-4" />
              Suggest a new topic
            </button>

            <div>
              <Label htmlFor="content" className="text-xs font-bold uppercase tracking-wider text-brand-grey">Content *</Label>
              <div className="mt-2">
                <RichTextEditor content={formData.content} onChange={(html) => setFormData(prev => ({ ...prev, content: html }))} placeholder="Share your marketing strategy, experience, data, and insights." />
              </div>
            </div>

            <div>
              <Label htmlFor="tags" className="text-xs font-bold uppercase tracking-wider text-brand-grey">Tags</Label>
              <Input id="tags" placeholder="e.g. social-media, strategy, ROI (comma-separated)" value={formData.tags} onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))} className="mt-2 border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none" data-testid="write-tags" />
            </div>

            {/* Co-Author Selection */}
            {user && partners.length > 0 && (
              <div data-testid="co-author-section">
                <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-grey">
                  <Users className="w-4 h-4" /> Co-Authors (optional)
                </Label>
                <p className="text-xs text-brand-grey mt-1 mb-3">Select partners to co-author this post with</p>
                <div className="flex flex-wrap gap-2">
                  {partners.map(p => {
                    const selected = selectedCoAuthors.includes(p.id);
                    return (
                      <button key={p.id} type="button" onClick={() => { if (selected) { setSelectedCoAuthors(prev => prev.filter(id => id !== p.id)); } else { setSelectedCoAuthors(prev => [...prev, p.id]); } }}
                        className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors border ${selected ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-white border-[#E5E5E5] text-brand-grey hover:border-[#1A1A1A]'}`}
                        data-testid={`co-author-toggle-${p.id}`}
                      >
                        <span className="w-5 h-5 rounded-full bg-brand-green text-white text-xs flex items-center justify-center font-bold">
                          {p.name[0].toUpperCase()}
                        </span>
                        {p.name}
                        {selected && <X className="w-3 h-3 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="border border-brand-red/30 bg-brand-red/5 p-4 text-sm text-brand-red" data-testid="write-error">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="rounded-none border-[#E5E5E5] uppercase tracking-widest text-xs font-bold" data-testid="write-cancel-btn">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-[#1A1A1A] text-white hover:bg-[#333] rounded-none font-bold px-8 uppercase tracking-widest text-xs transition-colors" data-testid="write-submit-btn">
              <Send className="w-4 h-4 mr-2" />
              {submitting ? (isEditing ? 'Updating...' : 'Publishing...') : (isEditing ? 'Update Post' : 'Publish Post')}
            </Button>
          </div>
        </form>

        {/* Suggest Topic Dialog */}
        <Dialog open={showSuggestDialog} onOpenChange={setShowSuggestDialog}>
          <DialogContent className="max-w-md rounded-none border-[#E5E5E5]">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-xl flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-brand-yellow" />
                Suggest a New Topic
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-brand-grey -mt-2">
              Don't see a topic that fits? Suggest one and it'll be reviewed.
            </p>
            <div className="space-y-4 mt-2">
              <div>
                <Label htmlFor="suggest-name" className="text-xs font-bold uppercase tracking-wider text-brand-grey">Topic Name *</Label>
                <Input id="suggest-name" placeholder="e.g. Growth Hacking, Neuromarketing..." value={suggestName} onChange={(e) => setSuggestName(e.target.value)} className="mt-2 border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none" data-testid="suggest-name-input" />
              </div>
              <div>
                <Label htmlFor="suggest-desc" className="text-xs font-bold uppercase tracking-wider text-brand-grey">Short Description *</Label>
                <Textarea id="suggest-desc" placeholder="What would this topic cover?" value={suggestDesc} onChange={(e) => setSuggestDesc(e.target.value)} rows={3} className="mt-2 border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none resize-none" data-testid="suggest-desc-input" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSuggestDialog(false)} className="rounded-none border-[#E5E5E5] uppercase tracking-widest text-xs font-bold" data-testid="suggest-cancel-btn">Cancel</Button>
                <Button onClick={handleSuggestTopic} disabled={suggestSubmitting || !suggestName.trim() || !suggestDesc.trim()} className="bg-[#1A1A1A] text-white hover:bg-[#333] rounded-none font-bold uppercase tracking-widest text-xs" data-testid="suggest-submit-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  {suggestSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

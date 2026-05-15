import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import BlogCard from '../components/BlogCard';
import { ArrowLeft, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { API, categories } = useApp();
  const [category, setCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const perPage = 12;

  const isAll = slug === 'all';

  useEffect(() => {
    if (!isAll && slug) {
      axios.get(`${API}/categories/${slug}`).then(res => setCategory(res.data)).catch(() => {});
    }
  }, [slug, API, isAll]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (!isAll && slug) params.set('category', slug);
    if (activeSubcategory) params.set('subcategory', activeSubcategory);
    if (search) params.set('search', search);
    params.set('limit', perPage.toString());
    params.set('page', currentPage.toString());

    axios.get(`${API}/posts?${params.toString()}`)
     .then(res => {
  setPosts(res.data.posts || []);
  setTotal(res.data.total || 0);
  setTotalPages(res.data.pages || res.data.total_pages || 1);
})
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, activeSubcategory, search, API, isAll, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [slug, activeSubcategory, search]);

  return (
    <div className="min-h-screen" data-testid="category-page">
      {/* Hero banner */}
      <section className="py-12 md:py-20 border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-grey hover:text-[#1A1A1A] mb-8 no-underline transition-colors" data-testid="category-back-link">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>

          <div className="flex items-start gap-4">
            {!isAll && category && (
              <div className="w-12 h-12 flex items-center justify-center text-white font-bold text-xl bg-[#1A1A1A] flex-shrink-0">
                {category.name[0]}
              </div>
            )}
            <div>
              <h1 className="font-heading font-bold text-3xl md:text-5xl tracking-tight text-[#1A1A1A] mb-2" data-testid="category-title">
                {isAll ? 'All Posts' : (category?.name || 'Loading...')}
              </h1>
              {category && (
                <p className="text-base text-brand-grey max-w-2xl">{category.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest rounded-none">{total} {total === 1 ? 'post' : 'posts'}</Badge>
              </div>
            </div>
          </div>

          {/* Subcategories */}
          {category?.subcategories?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8" data-testid="subcategory-filters">
              <button
                onClick={() => setActiveSubcategory(null)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${!activeSubcategory ? 'bg-[#1A1A1A] text-white' : 'bg-white text-brand-grey hover:text-[#1A1A1A] border border-[#E5E5E5]'}`}
                data-testid="subcategory-all"
              >
                All
              </button>
              {category.subcategories.map(sub => (
                <button
                  key={sub.slug}
                  onClick={() => setActiveSubcategory(activeSubcategory === sub.slug ? null : sub.slug)}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${activeSubcategory === sub.slug ? 'bg-[#1A1A1A] text-white' : 'bg-white text-brand-grey hover:text-[#1A1A1A] border border-[#E5E5E5]'}`}
                  data-testid={`subcategory-${sub.slug}`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Search + filter bar */}
      <div className="sticky top-16 z-40 bg-[#FDFCF8]/80 backdrop-blur-xl border-b border-[#E5E5E5] py-3">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-grey" />
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none h-10 text-sm"
              data-testid="category-search-input"
            />
          </div>
          {isAll && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-none border-[#E5E5E5] text-xs font-bold uppercase tracking-widest" data-testid="category-filter-btn">
                  <Filter className="w-3.5 h-3.5 mr-2" /> Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-lg border-[#E5E5E5]">
                <DropdownMenuItem onClick={() => {}} data-testid="filter-all">All Categories</DropdownMenuItem>
                {categories.map(cat => (
                  <DropdownMenuItem key={cat.slug} onClick={() => window.location.href = `/category/${cat.slug}`} data-testid={`filter-${cat.slug}`}>
                    <span className="w-2 h-2 rounded-full mr-2 bg-[#1A1A1A]" />
                    {cat.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Posts grid */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-[#F4F4F5] h-64 animate-pulse" />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="category-posts-grid">
                {posts.map((post, i) => (
                  <BlogCard key={post.id} post={post} index={i} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-16" data-testid="pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-none border-[#E5E5E5]"
                    data-testid="pagination-prev"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`rounded-none min-w-[36px] ${currentPage === pageNum ? 'bg-[#1A1A1A] text-white' : 'border-[#E5E5E5]'}`}
                        data-testid={`pagination-page-${pageNum}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-none border-[#E5E5E5]"
                    data-testid="pagination-next"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24" data-testid="no-posts">
              <p className="text-brand-grey text-base mb-4">No posts found in this category yet.</p>
              <Link to="/write" className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A] hover:text-brand-red no-underline transition-colors" data-testid="no-posts-write-link">
                Be the first to write one
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

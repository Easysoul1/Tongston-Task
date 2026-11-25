import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useContentList } from '../hooks/useApi';
import { Button } from '../components/ui/Form';
import { Input } from '../components/ui/Form';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import type { ContentItem } from '../types';

export function ContentListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [localTag, setLocalTag] = useState('');
  const [localSearch, setLocalSearch] = useState('');

  const page = parseInt(searchParams.get('page') || '1', 10);
  const tag = searchParams.get('tag') || '';
  const q = searchParams.get('q') || '';

  const { data, isLoading, error, refetch } = useContentList({ page, tag: tag || undefined, q: q || undefined, limit: 10 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (localSearch) params.set('q', localSearch);
    if (localTag) params.set('tag', localTag);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleTagChange = (newTag: string) => {
    setLocalTag(newTag);
    const params = new URLSearchParams();
    if (localSearch) params.set('q', localSearch);
    if (newTag) params.set('tag', newTag);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  const columns = [
    { key: 'title', header: 'Title', className: 'min-w-[200px]', render: (item: ContentItem) => <span className="font-medium truncate max-w-xs">{item.title}</span> },
    { key: 'tags', header: 'Tags', className: 'min-w-[150px]', render: (item: ContentItem) => (
      <div className="flex flex-wrap gap-1">
        {item.tags.slice(0, 3).map((t) => <Badge key={t} variant="secondary" size="sm">{t}</Badge>)}
        {item.tags.length > 3 && <Badge variant="secondary" size="sm">+{item.tags.length - 3}</Badge>}
      </div>
    )},
    { key: 'createdAt', header: 'Created', className: 'min-w-[130px] hidden md:table-cell', render: (item: ContentItem) => (
      <span className="text-surface-500 whitespace-nowrap">{new Date(item.createdAt).toLocaleDateString()}</span>
    )},
    { key: 'actions', header: '', className: 'w-[80px] text-right', render: (item: ContentItem) => (
      <Link to={`/content/${item.id}`} className="text-primary-600 hover:underline text-sm font-medium">View</Link>
    )},
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-surface-900 truncate">Content</h1>
          <p className="text-surface-500 mt-1">Manage your content library</p>
        </div>
        <Link to="/content/new" className="w-full sm:w-auto flex justify-center sm:justify-end">
          <Button size="lg"><Plus className="h-4 w-4 mr-2" /> Create Content</Button>
        </Link>
      </div>

      <Card padding="md">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
            <Input
              placeholder="Search content..."
              value={localSearch || q}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
            <select
              value={localTag || tag}
              onChange={(e) => handleTagChange(e.target.value)}
              className="w-full pl-10 pr-8 py-2 rounded-xl border bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-surface-50 disabled:cursor-not-allowed border-surface-300 hover:border-surface-400 appearance-none"
            >
              <option value="">All Tags</option>
              {data?.data.flatMap((c: ContentItem) => c.tags).filter((v, i, a) => a.indexOf(v) === i).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </form>
      </Card>

      <Card padding="none">
        {isLoading ? (
          <div className="p-8 space-y-3" role="status" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-surface-100 animate-pulse rounded" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600" role="alert">
            <p>Failed to load content</p>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="mt-2">Retry</Button>
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={data?.data || []}
              keyExtractor={(item) => item.id}
              emptyMessage="No content found. Create your first piece!"
              responsive={true}
            />
            {data && data.pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-surface-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-surface-500 text-center sm:text-left">
                  Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.totalItems} items)
                </p>
                <div className="flex justify-center sm:justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(data.pagination.page - 1)}
                    disabled={data.pagination.page === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(data.pagination.page + 1)}
                    disabled={data.pagination.page === data.pagination.totalPages}
                    aria-label="Next page"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
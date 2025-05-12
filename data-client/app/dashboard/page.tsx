'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WebflowClient } from 'webflow-api';

interface Site {
  id: string;
  webflow_site_id: string;
  owner: string;
  created_at: string;
  name?: string;
}

interface Page {
  id: string;
  webflow_site_id: string;
  webflow_page_id: string;
  name: string;
  head_files: string[];
  body_files: string[];
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch sites on component mount
  useEffect(() => {
    async function fetchSites() {
      try {
        const response = await fetch('/api/sites');
        if (!response.ok) {
          throw new Error('Failed to fetch sites');
        }
        const data = await response.json();
        setSites(data.sites || []);
        
        // Select the first site by default
        if (data.sites && data.sites.length > 0) {
          setSelectedSite(data.sites[0].webflow_site_id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sites:', error);
        setLoading(false);
      }
    }
    
    fetchSites();
  }, []);
  
  // Fetch pages when a site is selected
  useEffect(() => {
    if (!selectedSite) return;
    
    async function fetchPages() {
      try {
        const response = await fetch(`/api/pages?siteId=${selectedSite}`);
        if (!response.ok) {
          throw new Error('Failed to fetch pages');
        }
        const data = await response.json();
        setPages(data.pages || []);
      } catch (error) {
        console.error('Error fetching pages:', error);
      }
    }
    
    fetchPages();
  }, [selectedSite]);
  
  // Handle site selection change
  const handleSiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSite(e.target.value);
  };
  
  // Handle refresh button click
  const handleRefresh = async () => {
    if (!selectedSite || refreshing) return;
    
    setRefreshing(true);
    try {
      const response = await fetch(`/api/pages/sync?siteId=${selectedSite}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh pages');
      }
      
      const data = await response.json();
      console.log('Sync result:', data);
      
      // Fetch updated pages
      const pagesResponse = await fetch(`/api/pages?siteId=${selectedSite}`);
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        setPages(pagesData.pages || []);
      }
      
      alert(`Pages refreshed! Added: ${data.added}, Updated: ${data.updated}`);
    } catch (error) {
      console.error('Error refreshing pages:', error);
      alert('Failed to refresh pages. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };
  
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }
  
  if (sites.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">No sites found</h1>
        <p>You need to authorize at least one Webflow site to use this app.</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => router.push('/api/auth/authorize?state=webflow_designer')}
        >
          Authorize Webflow Site
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Custom Code Manager</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Site
        </label>
        <select 
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={selectedSite || ''}
          onChange={handleSiteChange}
        >
          {sites.map((site) => (
            <option key={site.webflow_site_id} value={site.webflow_site_id}>
              {site.name || site.webflow_site_id}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Pages</h2>
        <button 
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Pages'}
        </button>
      </div>
      
      {pages.length === 0 ? (
        <p className="text-gray-500">No pages found for this site.</p>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-md">
          <ul className="divide-y divide-gray-200">
            {pages.map((page) => (
              <li key={page.webflow_page_id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{page.name}</h3>
                    <p className="text-sm text-gray-500">{page.webflow_page_id}</p>
                  </div>
                  <div className="flex space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Head Files: {page.head_files?.length || 0}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Body Files: {page.body_files?.length || 0}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 
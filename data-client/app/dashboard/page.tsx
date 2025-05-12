'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WebflowClient } from 'webflow-api';
import React from 'react';

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

interface FileData {
  id: string;
  webflow_site_id: string;
  name: string;
  language: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [files, setFiles] = useState<FileData[]>([]);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [headList, setHeadList] = useState<string[]>([]);
  const [bodyList, setBodyList] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'page' | 'site'>('page');
  
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
  
  // Fetch files when a site is selected
  useEffect(() => {
    if (!selectedSite) return;

    async function fetchFiles() {
      try {
        const response = await fetch(`/api/files?siteId=${selectedSite}`);
        if (!response.ok) {
          throw new Error('Failed to fetch files');
        }
        const data = await response.json();
        setFiles(data.files || []);
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    }

    fetchFiles();
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
  
  // Handle opening the edit modal
  const openEditModal = (page: Page) => {
    setEditingPage(page);
    setHeadList(page.head_files || []);
    setBodyList(page.body_files || []);
    setActiveTab('page');
  };

  // Add a file to head list
  const addHeadFile = (fileId: string) => {
    if (!headList.includes(fileId)) {
      setHeadList([...headList, fileId]);
    }
  };

  const addBodyFile = (fileId: string) => {
    if (!bodyList.includes(fileId)) {
      setBodyList([...bodyList, fileId]);
    }
  };

  const removeHeadFile = (index: number) => {
    setHeadList(headList.filter((_, i) => i !== index));
  };

  const removeBodyFile = (index: number) => {
    setBodyList(bodyList.filter((_, i) => i !== index));
  };

  const moveUp = (list: string[], index: number): string[] => {
    if (index === 0) return list;
    const newList = [...list];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    return newList;
  };

  const moveDown = (list: string[], index: number): string[] => {
    if (index === list.length - 1) return list;
    const newList = [...list];
    [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
    return newList;
  };

  // Save selections to server
  const savePageFiles = async () => {
    if (!editingPage) return;
    try {
      const response = await fetch(`/api/pages/${editingPage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          head_files: headList,
          body_files: bodyList
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update page');
      }

      const { page: updatedPage } = await response.json();

      // Update local pages state
      setPages((prev) => prev.map((p) => (p.id === updatedPage.id ? updatedPage : p)));
      setEditingPage(null);
    } catch (error) {
      console.error('Error updating page:', error);
      alert('Failed to update page files');
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
                    <button
                      className="ml-4 px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                      onClick={() => openEditModal(page)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Edit Modal */}
      {editingPage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6">
            <h3 className="text-lg font-semibold mb-4">
              Manage Code Files for {editingPage.name}
            </h3>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4 flex space-x-8">
              <button
                className={`pb-2 px-1 border-b-2 text-sm font-medium ${activeTab === 'page' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('page')}
              >
                This page
              </button>
              <button
                className={`pb-2 px-1 border-b-2 text-sm font-medium ${activeTab === 'site' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('site')}
              >
                Entire site
              </button>
            </div>

            {activeTab === 'page' ? (
              <>
                {/* Head Section */}
                <section className="mb-8">
                  <h4 className="font-medium mb-2">Files before the closing &lt;/head&gt; tag:</h4>
                  <ul className="space-y-2">
                    {headList.map((fileId, idx) => {
                      const file = files.find((f) => f.id === fileId);
                      if (!file) return null;
                      return (
                        <li key={fileId} className="flex items-center justify-between border px-3 py-2 rounded">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold uppercase text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {file.language}
                            </span>
                            <span>{file.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <button onClick={() => setHeadList(moveUp(headList, idx))} disabled={idx === 0} className="hover:text-gray-900">▲</button>
                            <button onClick={() => setHeadList(moveDown(headList, idx))} disabled={idx === headList.length - 1} className="hover:text-gray-900">▼</button>
                            <button onClick={() => removeHeadFile(idx)} className="hover:text-red-600">✕</button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {/* Add file dropdown */}
                  <div className="mt-2">
                    <select
                      className="border-dashed border-2 border-gray-300 w-full p-2 text-center text-gray-500 cursor-pointer"
                      value=""
                      onChange={(e) => {
                        addHeadFile(e.target.value);
                        e.target.value = '';
                      }}
                    >
                      <option value="" disabled>
                        + add a new code file
                      </option>
                      {files
                        .filter((f) => !headList.includes(f.id))
                        .map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </section>

                {/* Body Section */}
                <section className="mb-8">
                  <h4 className="font-medium mb-2">Files before the closing &lt;/body&gt; tag:</h4>
                  <ul className="space-y-2">
                    {bodyList.map((fileId, idx) => {
                      const file = files.find((f) => f.id === fileId);
                      if (!file) return null;
                      return (
                        <li key={fileId} className="flex items-center justify-between border px-3 py-2 rounded">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold uppercase text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {file.language}
                            </span>
                            <span>{file.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <button onClick={() => setBodyList(moveUp(bodyList, idx))} disabled={idx === 0} className="hover:text-gray-900">▲</button>
                            <button onClick={() => setBodyList(moveDown(bodyList, idx))} disabled={idx === bodyList.length - 1} className="hover:text-gray-900">▼</button>
                            <button onClick={() => removeBodyFile(idx)} className="hover:text-red-600">✕</button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {/* Add file dropdown */}
                  <div className="mt-2">
                    <select
                      className="border-dashed border-2 border-gray-300 w-full p-2 text-center text-gray-500 cursor-pointer"
                      value=""
                      onChange={(e) => {
                        addBodyFile(e.target.value);
                        e.target.value = '';
                      }}
                    >
                      <option value="" disabled>
                        + add a new code file
                      </option>
                      {files
                        .filter((f) => !bodyList.includes(f.id))
                        .map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </section>
              </>
            ) : (
              <div className="text-gray-500">Site-wide code management coming soon.</div>
            )}

            <div className="mt-4 flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setEditingPage(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={savePageFiles}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
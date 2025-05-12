import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Divider,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../hooks/useAuth";
import { useFiles } from "../hooks/useFiles";
import { usePages } from "../hooks/usePages";

interface PageFileManagerProps {
  siteId: string;
}

interface SupabasePage {
  id: string;
  webflow_page_id: string;
  name: string;
  head_files: string[];
  body_files: string[];
}

export function PageFileManager({ siteId }: PageFileManagerProps) {
  const { sessionToken } = useAuth();
  const base_url = import.meta.env.VITE_NEXTJS_API_URL;

  // fetch pages & files using existing hooks
  const { data: pages = [], isLoading: pagesLoading } = usePages(siteId);
  const {
    files,
    isLoading: filesLoading,
  } = useFiles(siteId, sessionToken || "");

  // Selected page
  const [selectedPageId, setSelectedPageId] = useState<string | "">("");

  // local state lists
  const [headList, setHeadList] = useState<string[]>([]);
  const [bodyList, setBodyList] = useState<string[]>([]);

  // Tab selection
  const [activeTab, setActiveTab] = useState<"page" | "site">("page");

  const [sbPages, setSbPages] = useState<SupabasePage[]>([]);

  // Create a mapping between Webflow page IDs and Supabase page IDs
  const [pageMapping, setPageMapping] = useState<Record<string, string>>({});

  // Track current Webflow page
  const [currentWebflowPageId, setCurrentWebflowPageId] = useState<string | null>(null);

  // Get current page ID from Webflow
  useEffect(() => {
    async function getCurrentPage() {
      try {
        const currentPage = await webflow.getCurrentPage();
        if (currentPage) {
          const pageId = currentPage.id;
          console.log("🔍 Current Webflow page ID:", pageId);
          setCurrentWebflowPageId(pageId);
        }
      } catch (e) {
        console.error("❌ Error getting current Webflow page:", e);
      }
    }
    
    getCurrentPage();
  }, []);

  // fetch supabase pages list once
  useEffect(() => {
    async function fetchSbPages() {
      if (!siteId) return;
      try {
        console.log("🔄 Fetching Supabase pages for site:", siteId);
        const res = await fetch(`${base_url}/api/pages?siteId=${siteId}`, {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch supabase pages");
        const j = await res.json();
        console.log("📄 Supabase pages raw response:", j);
        setSbPages(j.pages || []);
      } catch (e) {
        console.error("❌ Error fetching Supabase pages:", e);
      }
    }
    fetchSbPages();
  }, [siteId, base_url, sessionToken]);

  // Build the mapping when both pages lists are loaded
  useEffect(() => {
    if (sbPages.length > 0) {
      console.log("🔄 Building page mapping");
      console.log("📊 Supabase pages for mapping:", sbPages);
      
      const mapping: Record<string, string> = {};
      sbPages.forEach(p => {
        if (p.webflow_page_id) {
          console.log(`🔗 Mapping Webflow page ${p.webflow_page_id} to Supabase ID ${p.id}`);
          mapping[p.webflow_page_id] = p.id;
        }
      });
      console.log("🗺️ Final page mapping:", mapping);
      setPageMapping(mapping);
    }
  }, [pages, sbPages]);

  // When pages fetched set default page
  useEffect(() => {
    if (!pagesLoading && pages.length > 0 && !selectedPageId) {
      // If we have the current page ID, select that
      if (currentWebflowPageId) {
        const currentWebflowPage = pages.find(p => p.id === currentWebflowPageId);
        if (currentWebflowPage) {
          console.log("📌 Automatically selecting current page:", currentWebflowPageId);
          setSelectedPageId(currentWebflowPageId);
          return;
        }
      }
      
      // Fallback: select first page
      console.log("📌 Setting default page (fallback):", pages[0].id);
      setSelectedPageId(pages[0].id);
    }
  }, [pagesLoading, pages, selectedPageId, currentWebflowPageId]);

  // Fetch page details when selectedPageId changes
  useEffect(() => {
    if (!selectedPageId) return;
    console.log("🔄 Selected page ID changed to:", selectedPageId);
    
    // The selected page ID is from Webflow but the pages in sbPages might not have a
    // direct mapping with webflow_page_id. Let's log to find the issue.
    console.log("📄 Webflow pages available:", pages);
    console.log("📄 Supabase pages available:", sbPages);
    
    // Use our mapping to find the correct Supabase page ID
    const sbPageId = pageMapping[selectedPageId];
    console.log("🔍 Mapped Supabase page ID:", sbPageId);
    
    // Find the page in our sbPages list
    const sbPage = sbPageId ? sbPages.find(p => p.id === sbPageId) : null;
    
    console.log("🔍 Found Supabase page:", sbPage);
    if (sbPage) {
      // Debug head_files content
      console.log("📋 head_files raw:", sbPage.head_files);
      console.log("📋 body_files raw:", sbPage.body_files);
      console.log("📋 Type checking: head_files is array:", Array.isArray(sbPage.head_files));
      console.log("📋 Type checking: body_files is array:", Array.isArray(sbPage.body_files));
      
      // Parse arrays from various possible formats
      let headIds: string[] = [];
      let bodyIds: string[] = [];
      
      // Handle head_files - could be array, JSON string, or null
      try {
        if (Array.isArray(sbPage.head_files)) {
          headIds = sbPage.head_files.map(id => String(id));
        } else if (typeof sbPage.head_files === 'string') {
          // Try to parse as JSON string
          const parsed = JSON.parse(sbPage.head_files);
          headIds = Array.isArray(parsed) ? parsed.map(id => String(id)) : [];
        } else if (sbPage.head_files) {
          // Last resort - try to convert to array if it's truthy
          headIds = [String(sbPage.head_files)];
        }
      } catch (e) {
        console.error("❌ Error parsing head_files:", e);
      }
      
      // Handle body_files - could be array, JSON string, or null
      try {
        if (Array.isArray(sbPage.body_files)) {
          bodyIds = sbPage.body_files.map(id => String(id));
        } else if (typeof sbPage.body_files === 'string') {
          // Try to parse as JSON string
          const parsed = JSON.parse(sbPage.body_files);
          bodyIds = Array.isArray(parsed) ? parsed.map(id => String(id)) : [];
        } else if (sbPage.body_files) {
          // Last resort - try to convert to array if it's truthy
          bodyIds = [String(sbPage.body_files)];
        }
      } catch (e) {
        console.error("❌ Error parsing body_files:", e);
      }
      
      console.log("📋 Final head IDs as strings:", headIds);
      console.log("📋 Final body IDs as strings:", bodyIds);
      
      setHeadList(headIds);
      setBodyList(bodyIds);
    } else {
      console.log("❌ No matching Supabase page found, using empty arrays");
      setHeadList([]);
      setBodyList([]);
    }
  }, [selectedPageId, sbPages, pages, pageMapping]);

  // Helpers for reorder
  const moveUp = (list: string[], idx: number) => {
    if (idx === 0) return list;
    const newList = [...list];
    [newList[idx - 1], newList[idx]] = [newList[idx], newList[idx - 1]];
    return newList;
  };
  const moveDown = (list: string[], idx: number) => {
    if (idx === list.length - 1) return list;
    const newList = [...list];
    [newList[idx + 1], newList[idx]] = [newList[idx], newList[idx + 1]];
    return newList;
  };

  const saveChanges = async () => {
    if (!selectedPageId) return;
    
    console.log("💾 Saving changes for selected page:", selectedPageId);
    console.log("📋 Current head list (strings):", headList);
    console.log("📋 Current body list (strings):", bodyList);
    
    // Convert IDs back to numbers for Supabase
    const headIdsForSave = headList.map(id => Number(id));
    const bodyIdsForSave = bodyList.map(id => Number(id));
    
    console.log("📋 Head IDs converted to numbers for save:", headIdsForSave);
    console.log("📋 Body IDs converted to numbers for save:", bodyIdsForSave);

    // Use our mapping to find the correct Supabase page ID
    const sbPageId = pageMapping[selectedPageId];
    if (!sbPageId) {
      console.error("❌ Could not find Supabase page ID for Webflow page:", selectedPageId);
      return;
    }
    
    console.log("💾 Saving changes to Supabase page ID:", sbPageId);
    
    try {
      const response = await fetch(`${base_url}/api/pages/${sbPageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ head_files: headIdsForSave, body_files: bodyIdsForSave }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Failed to update page:", errorText);
        return;
      }
      
      const result = await response.json();
      console.log("✅ Update result from server:", result);
      
      // update sbPages local state to reflect changes
      const headStr = headIdsForSave.map(id => String(id));
      const bodyStr = bodyIdsForSave.map(id => String(id));
      
      console.log("📋 Updating local state with head_files:", headStr);
      console.log("📋 Updating local state with body_files:", bodyStr);
      
      setSbPages(prev => {
        const newPages = prev.map(p => {
          if (p.id === sbPageId) {
            console.log("✏️ Updating page in local state:", p.id);
            return { ...p, head_files: headStr as any, body_files: bodyStr as any };
          }
          return p;
        });
        console.log("📄 Updated sbPages:", newPages);
        return newPages;
      });
      
      alert("Changes saved successfully!");
    } catch (e) {
      console.error("❌ Error saving changes:", e);
      alert("Failed to save changes. See console for details.");
    }
  };

  // UI for file list item
  const renderFileItem = (
    fileId: string,
    idx: number,
    list: string[],
    setList: (val: string[]) => void
  ) => {
    console.log(`🔍 Rendering file for ID ${fileId} at index ${idx}`);
    const file = files.find((f) => String(f.id) === fileId);
    console.log(`🔍 Found file for ID ${fileId}:`, file);
    if (!file) return null;
    return (
      <ListItem key={fileId} divider secondaryAction={
        <Box>
          <IconButton size="small" onClick={() => setList(moveUp(list, idx))} disabled={idx === 0}>
            <ArrowUpwardIcon fontSize="inherit" />
          </IconButton>
          <IconButton size="small" onClick={() => setList(moveDown(list, idx))} disabled={idx === list.length - 1}>
            <ArrowDownwardIcon fontSize="inherit" />
          </IconButton>
          <IconButton size="small" onClick={() => setList(list.filter((_, i) => i !== idx))}>
            <DeleteIcon fontSize="inherit" />
          </IconButton>
        </Box>
      }>
        <ListItemText primary={file.name} secondary={file.language.toUpperCase()} />
      </ListItem>
    );
  };

  return (
    <Card elevation={0} sx={{ mt: 4, border: "1px solid", borderColor: "divider" }}>
      <CardContent>
        <Typography variant="h3" gutterBottom>
          Page Code Manager
        </Typography>
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{ mb: 2 }}
        >
          <Tab label="This page" value="page" />
          <Tab label="Entire site" value="site" />
        </Tabs>

        {activeTab === "page" && (
          <Box>
            {/* Page selector */}
            <FormControl fullWidth size="small" sx={{ mb: 3 }}>
              <InputLabel id="page-select-label">Select page</InputLabel>
              <Select
                labelId="page-select-label"
                value={selectedPageId}
                label="Select page"
                onChange={(e) => setSelectedPageId(e.target.value as string)}
              >
                {pages.map((p: any) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Head section */}
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              Files before the closing &lt;/head&gt; tag:
            </Typography>
            <List dense sx={{ border: "1px dashed", borderColor: "divider", mb: 1 }}>
              {Array.isArray(headList) && headList.map((fid, idx) => renderFileItem(fid, idx, headList, setHeadList))}
            </List>
            <Select
              size="small"
              fullWidth
              displayEmpty
              value=""
              onChange={(e) => {
                const val = e.target.value as string;
                if (val) setHeadList([...headList, val]);
              }}
            >
              <MenuItem value="" disabled>
                + add a new code file
              </MenuItem>
              {files
                .filter((f) => !headList.includes(String(f.id)))
                .map((f) => (
                  <MenuItem key={f.id} value={String(f.id)}>
                    {f.name}
                  </MenuItem>
                ))}
            </Select>

            {/* Body section */}
            <Typography variant="subtitle1" sx={{ mt: 4 }}>
              Files before the closing &lt;/body&gt; tag:
            </Typography>
            <List dense sx={{ border: "1px dashed", borderColor: "divider", mb: 1 }}>
              {Array.isArray(bodyList) && bodyList.map((fid, idx) => renderFileItem(fid, idx, bodyList, setBodyList))}
            </List>
            <Select
              size="small"
              fullWidth
              displayEmpty
              value=""
              onChange={(e) => {
                const val = e.target.value as string;
                if (val) setBodyList([...bodyList, val]);
              }}
            >
              <MenuItem value="" disabled>
                + add a new code file
              </MenuItem>
              {files
                .filter((f) => !bodyList.includes(String(f.id)))
                .map((f) => (
                  <MenuItem key={f.id} value={String(f.id)}>
                    {f.name}
                  </MenuItem>
                ))}
            </Select>

            <Divider sx={{ my: 3 }} />
            <Button variant="contained" onClick={saveChanges} disabled={!selectedPageId}>
              Save changes
            </Button>
          </Box>
        )}

        {activeTab === "site" && (
          <Typography variant="body2" color="text.secondary">
            Site-wide file assignment coming soon.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
} 
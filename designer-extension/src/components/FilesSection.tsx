import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  IconButton,
  InputAdornment,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import { useFiles } from "../hooks/useFiles";
import { FileLanguage, SiteFile } from "../types/types";
import { useAuth } from "../hooks/useAuth";
import { MonacoCodeEditor } from "./MonacoCodeEditor";

interface FilesSectionProps {
  siteId: string;
}

export function FilesSection({ siteId }: FilesSectionProps) {
  const { sessionToken } = useAuth();
  const {
    files,
    isLoading,
    createFile,
    isCreating,
    updateFile,
    isUpdating,
    deleteFile,
    isDeleting,
  } = useFiles(siteId, sessionToken || "");

  // Dialog state for creating a file
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileLanguage, setNewFileLanguage] = useState<FileLanguage>("html");

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<SiteFile | null>(null);

  // Editor state
  const [editingFile, setEditingFile] = useState<SiteFile | null>(null);
  const [editingCode, setEditingCode] = useState<string>("");

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<FileLanguage | "all">("all");

  const openCreate = () => setIsCreateOpen(true);
  const closeCreate = () => setIsCreateOpen(false);

  const handleCreate = async () => {
    if (!newFileName.trim()) return;
    try {
      const { file } = await createFile({
        name: newFileName,
        language: newFileLanguage,
      }) as any;
      // Open editor for the new file
      if (file) {
        setEditingFile(file);
        setEditingCode(file.code || "");
      }
      setNewFileName("");
      setNewFileLanguage("html");
      closeCreate();
    } catch (error) {
      /* eslint-disable no-console */
      console.error("Error creating file:", error);
    }
  };

  const handleSaveCode = async () => {
    if (!editingFile) return;
    try {
      await updateFile({
        fileId: editingFile.id,
        fields: { code: editingCode },
      });
      setEditingFile(null);
      setEditingCode("");
    } catch (error) {
      console.error("Error saving file:", error);
    }
  };

  // Handle file deletion
  const openDeleteConfirm = (file: SiteFile) => {
    setFileToDelete(file);
    setDeleteConfirmOpen(true);
  };
  
  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setFileToDelete(null);
  };
  
  const handleDelete = async () => {
    if (!fileToDelete) return;
    try {
      await deleteFile({ fileId: fileToDelete.id });
      closeDeleteConfirm();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const languageOptions: FileLanguage[] = ["html", "css", "js"];

  // Filter files based on search query and language filter
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = languageFilter === "all" || file.language === languageFilter;
    return matchesSearch && matchesLanguage;
  });

  return (
    <Card
      elevation={0}
      sx={{ 
        mt: 4, 
        border: "1px solid", 
        borderColor: "divider", 
        bgcolor: "background.paper",
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
      }}
    >
      <CardContent sx={{ 
        p: 0,
        '&:last-child': {
          paddingBottom: 0
        }
      }}>
        <Box sx={{ p: 3, bgcolor: "rgba(255, 255, 255, 0.05)" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h3" sx={{ fontWeight: 600, color: "white" }}>Site Files</Typography>
            <Button 
              variant="contained" 
              onClick={openCreate} 
              disabled={isCreating}
              sx={{
                bgcolor: '#4353ff',
                '&:hover': {
                  bgcolor: '#3444F0'
                },
                fontWeight: 500,
                px: 2
              }}
            >
              New File
            </Button>
          </Box>
        </Box>

        {/* Search and Filter Section */}
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          gap: 2, 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          bgcolor: 'rgba(255, 255, 255, 0.02)'
        }}>
          <TextField
            size="small"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4353ff',
                },
              },
              '& .MuiInputBase-input': {
                color: 'white',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value as FileLanguage | "all")}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4353ff',
                },
              }}
            >
              <MenuItem value="all">All Languages</MenuItem>
              <MenuItem value="html">HTML</MenuItem>
              <MenuItem value="css">CSS</MenuItem>
              <MenuItem value="js">JavaScript</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ p: 3 }}>
          {isLoading ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress size={24} />
            </Box>
          ) : filteredFiles.length === 0 ? (
            <Box sx={{ 
              textAlign: "center", 
              py: 6, 
              backgroundColor: "rgba(255, 255, 255, 0.02)", 
              borderRadius: 2,
              border: "1px dashed rgba(255, 255, 255, 0.15)"
            }}>
              <Typography color="text.secondary">
                {files.length === 0 
                  ? "No files found for this site."
                  : "No files match your search criteria."}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {files.length === 0 
                  ? "Click \"New File\" to create your first file."
                  : "Try adjusting your search or filter."}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ 
              border: "1px solid rgba(255, 255, 255, 0.1)", 
              borderRadius: 1, 
              overflow: "hidden" 
            }}>
              <Table size="small" sx={{ 
                tableLayout: "fixed",
                '& .MuiList-root': {
                  paddingTop: 0,
                  paddingBottom: 0
                },
                '& .MuiTableBody-root': {
                  borderBottom: 'none'
                },
                margin: 0,
                border: 'none'
              }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      color: "rgba(255, 255, 255, 0.7)", 
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      fontSize: "0.8rem",
                      width: "40%"
                    }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      color: "rgba(255, 255, 255, 0.7)", 
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      fontSize: "0.8rem",
                      width: "20%"
                    }}>
                      Language
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      color: "rgba(255, 255, 255, 0.7)", 
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      fontSize: "0.8rem",
                      width: "30%"
                    }}>
                      Created
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      fontWeight: 600, 
                      color: "rgba(255, 255, 255, 0.7)", 
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      fontSize: "0.8rem",
                      width: "10%"
                    }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFiles.map((file, index) => (
                    <TableRow 
                      key={file.id} 
                      hover
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: "rgba(255, 255, 255, 0.05)" 
                        },
                        transition: "background-color 0.2s ease"
                      }}
                    >
                      <TableCell 
                        sx={{ 
                          py: 1.5, 
                          color: "white",
                          fontWeight: 500,
                          borderBottom: index === filteredFiles.length - 1 ? "none" : "1px solid rgba(255, 255, 255, 0.05)",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {file.name}
                      </TableCell>
                      <TableCell sx={{ 
                        py: 1.5,
                        borderBottom: index === filteredFiles.length - 1 ? "none" : "1px solid rgba(255, 255, 255, 0.05)"
                      }}>
                        <Box sx={{ 
                          bgcolor: file.language === 'html' 
                            ? 'rgba(227, 76, 38, 0.15)' 
                            : file.language === 'css' 
                            ? 'rgba(38, 77, 228, 0.15)' 
                            : 'rgba(247, 223, 30, 0.15)', 
                          color: file.language === 'html' 
                            ? '#E34C26' 
                            : file.language === 'css' 
                            ? '#264DE4' 
                            : '#F7DF1E', 
                          display: "inline-block", 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          letterSpacing: "0.5px"
                        }}>
                          {file.language.toUpperCase()}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ 
                        py: 1.5, 
                        color: "rgba(255, 255, 255, 0.6)",
                        fontSize: "0.85rem",
                        borderBottom: index === filteredFiles.length - 1 ? "none" : "1px solid rgba(255, 255, 255, 0.05)"
                      }}>
                        {new Date(file.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        borderBottom: index === filteredFiles.length - 1 ? "none" : "1px solid rgba(255, 255, 255, 0.05)"
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingFile(file);
                              setEditingCode(file.code || "");
                            }}
                            sx={{
                              color: "rgba(255, 255, 255, 0.7)",
                              '&:hover': {
                                color: "white",
                                backgroundColor: "rgba(255, 255, 255, 0.1)"
                              },
                              mr: 1
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => openDeleteConfirm(file)}
                            sx={{
                              color: "rgba(255, 130, 130, 0.7)",
                              '&:hover': {
                                color: "#ff5252",
                                backgroundColor: "rgba(255, 80, 80, 0.1)"
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      </CardContent>

      {/* Create Dialog */}
      <Dialog 
        open={isCreateOpen} 
        onClose={closeCreate} 
        fullWidth 
        maxWidth="sm"
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 2,
            bgcolor: '#292929'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontSize: "1.2rem", 
          fontWeight: 600, 
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          p: 2.5
        }}>
          New File
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, borderColor: "rgba(255, 255, 255, 0.1)" }}>
          <TextField
            label="File Name"
            fullWidth
            sx={{ 
              my: 2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.2)'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4353ff'
              }
            }}
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
          />
          <TextField
            label="Language"
            select
            fullWidth
            value={newFileLanguage}
            onChange={(e) => setNewFileLanguage(e.target.value as FileLanguage)}
            sx={{ 
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.2)'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4353ff'
              }
            }}
          >
            {languageOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt.toUpperCase()}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <Button 
            onClick={closeCreate}
            sx={{ color: "rgba(255, 255, 255, 0.7)" }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreate} 
            disabled={isCreating || !newFileName.trim()}
            sx={{
              bgcolor: '#4353ff',
              '&:hover': {
                bgcolor: '#3444F0'
              }
            }}
          >
            {isCreating ? <CircularProgress size={20} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Editor Dialog */}
      <Dialog
        open={Boolean(editingFile)}
        onClose={() => setEditingFile(null)}
        fullScreen
        sx={{
          '& .MuiPaper-root': {
            bgcolor: '#1E1E1E'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 1,
          p: 1.5,
          pl: 2,
          bgcolor: '#252525',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Typography sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
            {editingFile?.name}
            <Box component="span" sx={{ 
              ml: 1, 
              px: 1, 
              py: 0.3, 
              borderRadius: 1, 
              bgcolor: editingFile?.language === 'html' 
                ? 'rgba(227, 76, 38, 0.15)' 
                : editingFile?.language === 'css' 
                ? 'rgba(38, 77, 228, 0.15)' 
                : 'rgba(247, 223, 30, 0.15)',
              color: editingFile?.language === 'html' 
                ? '#E34C26' 
                : editingFile?.language === 'css' 
                ? '#264DE4' 
                : '#F7DF1E',
              fontSize: '0.7rem',
              fontWeight: 600
            }}>
              {editingFile?.language.toUpperCase()}
            </Box>
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            size="small"
            startIcon={isUpdating ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
            onClick={handleSaveCode}
            disabled={isUpdating}
            sx={{
              bgcolor: '#4353ff',
              '&:hover': {
                bgcolor: '#3444F0'
              },
              px: 2,
              py: 0.8
            }}
          >
            Save
          </Button>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <MonacoCodeEditor
            value={editingCode}
            language={editingFile?.language || "html"}
            onChange={(value) => setEditingCode(value)}
            onDiscard={() => setEditingFile(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={closeDeleteConfirm}
        maxWidth="xs"
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 2,
            bgcolor: '#292929'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontSize: "1.1rem", 
          fontWeight: 600, 
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          p: 2.5,
          color: "#ff5252"
        }}>
          Delete File
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Typography>
            Are you sure you want to delete <strong>{fileToDelete?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <Button 
            onClick={closeDeleteConfirm}
            sx={{ color: "rgba(255, 255, 255, 0.7)" }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleDelete} 
            disabled={isDeleting}
            sx={{
              bgcolor: '#ff5252',
              '&:hover': {
                bgcolor: '#ff3333'
              }
            }}
          >
            {isDeleting ? <CircularProgress size={20} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
} 
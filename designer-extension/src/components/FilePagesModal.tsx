import { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Box,
  CircularProgress,
  Tooltip,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useFilePages } from '../hooks/useFilePages';
import { SiteFile } from '../types/types';

interface FilePagesModalProps {
  open: boolean;
  onClose: () => void;
  file: SiteFile | null;
  siteId: string;
  sessionToken: string;
}

export function FilePagesModal({ open, onClose, file, siteId, sessionToken }: FilePagesModalProps) {
  const {
    pages,
    isLoading,
    error,
    fetchPages,
    removeFileFromPage
  } = useFilePages(siteId, file?.id || null, sessionToken);
  
  // Fetch pages when modal opens and file changes
  useEffect(() => {
    if (open && file?.id) {
      fetchPages();
    }
  }, [open, file?.id]);
  
  // Get location display info
  const getLocationInfo = (location: "head" | "body") => {
    if (location === "head") {
      return {
        label: "HEAD",
        color: "#3444F0",
        bgColor: "rgba(67, 83, 255, 0.1)"
      };
    } else {
      return {
        label: "BODY",
        color: "#E34C26",
        bgColor: "rgba(227, 76, 38, 0.1)"
      };
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiPaper-root': {
          borderRadius: 2,
          bgcolor: '#292929',
          minHeight: '400px'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: "flex", 
        alignItems: "center", 
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        p: 2.5
      }}>
        <Typography sx={{ fontSize: '1.2rem', fontWeight: 600, color: 'white' }}>
          Pages Using {file?.name || "File"}
        </Typography>
        <Box sx={{ ml: 'auto' }}>
          <IconButton onClick={onClose}>
            <CloseIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : pages.length === 0 ? (
          <Box sx={{ 
            textAlign: "center", 
            py: 8, 
            backgroundColor: "rgba(255, 255, 255, 0.02)", 
            m: 3,
            borderRadius: 2,
            border: "1px dashed rgba(255, 255, 255, 0.15)"
          }}>
            <Typography color="text.secondary">
              This file is not used on any page
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Add it to pages in the Page Code Manager
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
              {pages.length} page{pages.length !== 1 ? 's' : ''} using this file:
            </Typography>
            <Box sx={{ 
              border: "1px solid rgba(255, 255, 255, 0.1)", 
              borderRadius: 1, 
              overflow: "hidden" 
            }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      color: "rgba(255, 255, 255, 0.7)", 
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      fontSize: "0.8rem",
                      width: "50%"
                    }}>
                      Page Name
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600, 
                      color: "rgba(255, 255, 255, 0.7)", 
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      fontSize: "0.8rem",
                      width: "30%"
                    }}>
                      Location
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      fontWeight: 600, 
                      color: "rgba(255, 255, 255, 0.7)", 
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      fontSize: "0.8rem",
                      width: "20%"
                    }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pages.map((page, index) => {
                    const locationInfo = getLocationInfo(page.location);
                    return (
                      <TableRow 
                        key={`${page.id}-${page.location}`} 
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
                            borderBottom: index === pages.length - 1 ? "none" : "1px solid rgba(255, 255, 255, 0.05)",
                          }}
                        >
                          {page.name}
                        </TableCell>
                        <TableCell sx={{ 
                          py: 1.5,
                          borderBottom: index === pages.length - 1 ? "none" : "1px solid rgba(255, 255, 255, 0.05)"
                        }}>
                          <Chip 
                            label={locationInfo.label} 
                            size="small" 
                            sx={{ 
                              bgcolor: locationInfo.bgColor,
                              color: locationInfo.color,
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }} 
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ 
                          borderBottom: index === pages.length - 1 ? "none" : "1px solid rgba(255, 255, 255, 0.05)"
                        }}>
                          <Tooltip title="Remove from page">
                            <IconButton
                              size="small"
                              onClick={() => removeFileFromPage(page.id, page.location)}
                              sx={{
                                color: "rgba(255, 130, 130, 0.7)",
                                '&:hover': {
                                  color: "#ff5252",
                                  backgroundColor: "rgba(255, 80, 80, 0.1)"
                                },
                                padding: '4px'
                              }}
                            >
                              <CloseIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
} 
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from "@mui/material";
import { Site } from "../types/types";

interface DataTableProps {
  data: Site[];
  onRowSelect?: (siteId: string) => void;
  selectedRow?: string | null;
}

const DataTable = ({ data, onRowSelect, selectedRow }: DataTableProps) => {
  webflow.setExtensionSize("large");

  const handleRowClick = (siteId: string) => {
    if (onRowSelect) {
      onRowSelect(siteId);
    }
  };

  return (
    <Paper sx={{ maxHeight: "275px", overflow: "auto" }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Display Name</TableCell>
            <TableCell>ID</TableCell>
            <TableCell>Created On</TableCell>
            <TableCell>Last Updated</TableCell>
            <TableCell>Last Published</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow 
              key={item.id} 
              onClick={() => handleRowClick(item.id)}
              sx={{ 
                cursor: onRowSelect ? 'pointer' : 'default',
                backgroundColor: selectedRow === item.id ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              <TableCell>{item.displayName}</TableCell>
              <TableCell>{item.id}</TableCell>
              <TableCell>
                {new Date(item.createdOn).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {new Date(item.lastUpdated).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {item.lastPublished
                  ? new Date(item.lastPublished).toLocaleDateString()
                  : "N/A"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default DataTable;

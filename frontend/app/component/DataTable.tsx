'use client'

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface DataTableProps {
  data: any[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [showAllRows, setShowAllRows] = useState(false);
  
  if (data.length === 0) return null;

  const headers = Object.keys(data[0]);
  const displayedData = showAllRows ? data : data.slice(0, 10);

  return (
    <div className="p-4">
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((header, cellIndex) => (
                  <TableCell key={cellIndex}>{row[header]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data.length > 10 && (
        <div className="mt-4">
          <Button 
            onClick={() => setShowAllRows(!showAllRows)}
            variant="outline"
          >
            {showAllRows ? "Show Less" : "Show All"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DataTable;



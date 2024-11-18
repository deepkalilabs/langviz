"use client"

import React from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataSet, ChartData } from "./types";
import { useState, useEffect } from "react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui/drawer"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';


import DataTable from "./DataTable" // Assuming this is the correct import path

interface DataDrawerProps {
  isOpen: boolean
  onClose: () => void
  originalData: DataSet | null
  chartData: ChartData | null
}

export function DataDrawer({ isOpen, onClose, originalData, chartData }: DataDrawerProps) {
  console.log("originalData", originalData);
  console.log("chartData", chartData);

  const { 
    pd_code: pandasCode, 
    pd_viz_code: vizCode, 
    data: subsetChartData } = chartData ?? {};

  //const [activeData, setActiveData] = useState<any>(chartData ?? originalData);
  const [activeTab, setActiveTab] = useState<string>("data");
  const activeData = chartData ?? originalData;

  console.log("activeData", activeData);
  console.log("pandasCode", pandasCode);
  console.log("vizCode", vizCode);
  console.log("subsetChartData", subsetChartData);

  useEffect(() => {
    console.log("activetab", activeTab);
  }, [activeTab]);

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-1/2 ml-auto">
        <DrawerHeader className="border-b flex flex-col items-center justify-center">
          <Tabs className="w-[400px]" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-center">
              <TabsTrigger value="data">Data</TabsTrigger>  
              <TabsTrigger value="pd_code" disabled={pandasCode === undefined}>Pandas Code</TabsTrigger>
              <TabsTrigger value="pd_viz_code" disabled={vizCode === undefined}>Viz Code</TabsTrigger>
            </TabsList>
          </Tabs>
        </DrawerHeader>
        
        {activeTab === "data" && (
          <div className="flex-grow overflow-auto p-4">
            {activeData?.data && <DataTable originalData={activeData as DataSet} />}
          </div>
        )}
        {activeTab === "pd_code" && (
          <div className="flex-grow overflow-auto p-4">
            <SyntaxHighlighter language="python">{chartData?.pd_code || ''}</SyntaxHighlighter>
          </div>
        )}
        {activeTab === "pd_viz_code" && (
          <div className="flex-grow overflow-auto p-4">
            <SyntaxHighlighter language="python">{chartData?.pd_viz_code || ''}</SyntaxHighlighter>
          </div>
        )}
        <DrawerFooter className="border-t">
          <p className="text-sm text-muted-foreground">
            {activeData?.data && Array.isArray(activeData.data) && activeData.data.length > 0 && activeTab === "data" && 
              `Showing ${activeData.data.length} rows & ${Object.keys(activeData.data[0]).length} columns.`
            }
          </p>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
        <DrawerClose className="absolute right-4 top-4">
          <Button variant="ghost" size="icon">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}

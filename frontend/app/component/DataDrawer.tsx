"use client"

import React from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataSetApiResponse, OriginalDataSet } from "./types";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import DataTable from "./DataTable" // Assuming this is the correct import path

interface DataDrawerProps {
  isOpen: boolean
  onClose: () => void
  originalData: OriginalDataSet
  apiData: DataSetApiResponse 
}

export function DataDrawer({ isOpen, onClose, originalData, apiData }: DataDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-1/2 ml-auto">
        <DrawerHeader className="border-b">
          <DrawerTitle className="text-xl font-semibold">CSV Data Preview</DrawerTitle>
          <DrawerDescription className="text-sm text-muted-foreground">
            Showing your uploaded CSV data.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-grow overflow-auto p-4">
          <DataTable dataResponse={apiData} originalData={originalData} />
        </div>
        <DrawerFooter className="border-t">
          <p className="text-sm text-muted-foreground">
            Showing {originalData.data.length} rows.
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

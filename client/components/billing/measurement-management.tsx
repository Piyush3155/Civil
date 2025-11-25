"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { BOQItem, MeasurementBook } from "@/types/billing"

interface MeasurementManagementProps {
  projectId: string
}

export function MeasurementManagement({ projectId }: MeasurementManagementProps) {
  const [boqItems, setBoqItems] = useState<BOQItem[]>([])
  const [measurements, setMeasurements] = useState<MeasurementBook[]>([])
  const [selectedBOQ, setSelectedBOQ] = useState("")
  const [quantity, setQuantity] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchMeasurements = useCallback(async () => {
    try {
      const res = await fetch(`/api/billing/measurement?projectId=${projectId}`)
      const data = await res.json()
      setMeasurements(data)
    } catch (error) {
      console.error("Error fetching measurements:", error)
    }
  }, [projectId])

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true)
      try {
        const [boqRes, measureRes] = await Promise.all([
          fetch(`/api/billing/boq?projectId=${projectId}`),
          fetch(`/api/billing/measurement?projectId=${projectId}`),
        ])

        const [boqData, measureData] = await Promise.all([boqRes.json(), measureRes.json()])

        setBoqItems(boqData)
        setMeasurements(measureData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAll()
  }, [projectId])

  const submitMeasurement = async () => {
    if (!selectedBOQ || !quantity) return

    setIsSubmitting(true)
    try {
      await fetch("/api/billing/measurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boqItemId: selectedBOQ,
          projectId,
          measuredQty: Number.parseFloat(quantity),
          description,
          createdBy: "current-user-id",
        }),
      })
      await fetchMeasurements()
      setSelectedBOQ("")
      setQuantity("")
      setDescription("")
    } catch (error) {
      console.error("Error submitting measurement:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full space-y-6 p-4 md:p-6">
      {/* Add Measurement Card */}
      <Card className="border-0 shadow-sm md:shadow">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-transparent pb-4">
          <CardTitle className="text-lg md:text-xl">Add Measurement</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Record a new measurement for site verification</p>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            <div>
              <Label htmlFor="boq" className="text-sm font-medium">
                BOQ Item
              </Label>
              <Select value={selectedBOQ} onValueChange={setSelectedBOQ}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select BOQ item" />
                </SelectTrigger>
                <SelectContent>
                  {boqItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantity" className="text-sm font-medium">
                Measured Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                className="mt-2"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="mt-2"
            />
          </div>
          <Button
            onClick={submitMeasurement}
            disabled={isSubmitting || !selectedBOQ || !quantity}
            className="w-full md:w-auto"
          >
            {isSubmitting ? "Submitting..." : "Submit Measurement"}
          </Button>
        </CardContent>
      </Card>

      {/* Measurements List Card */}
      <Card className="border-0 shadow-sm md:shadow">
        <CardHeader className="border-b bg-gradient-to-r from-green-50 to-transparent pb-4">
          <CardTitle className="text-lg md:text-xl">Measurements</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{measurements.length} measurements recorded</p>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading measurements...</p>
            </div>
          ) : measurements.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No measurements recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="text-sm font-semibold">BOQ Item</TableHead>
                    <TableHead className="text-sm font-semibold hidden md:table-cell">Quantity</TableHead>
                    <TableHead className="text-sm font-semibold hidden lg:table-cell">Description</TableHead>
                    <TableHead className="text-sm font-semibold">Status</TableHead>
                    <TableHead className="text-sm font-semibold hidden sm:table-cell">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {measurements.map((measurement) => (
                    <TableRow key={measurement.id} className="border-b hover:bg-muted/50">
                      <TableCell className="text-sm font-medium">{measurement.boqItem.name}</TableCell>
                      <TableCell className="text-sm hidden md:table-cell">
                        {measurement.measuredQty}{" "}
                        <span className="text-muted-foreground">{measurement.boqItem.unit}</span>
                      </TableCell>
                      <TableCell className="text-sm hidden lg:table-cell text-muted-foreground">
                        {measurement.description || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <Badge variant={measurement.approvedAt ? "default" : "secondary"} className="text-xs">
                          {measurement.approvedAt ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm hidden sm:table-cell text-muted-foreground">
                        {new Date(measurement.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

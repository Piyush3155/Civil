"use client"

import { Activity } from "lucide-react"
import { Pie, PieChart, Label, Cell } from "@/components/ui/chart"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface ProjectStatusChartProps {
  data: Array<{
    status: string
    visitors: number
    fill: string
  }>
  config: ChartConfig
  totalProjects: number
  activeProjects: number
}

export function ProjectStatusChart({
  data,
  config,
  totalProjects,
  activeProjects,
}: ProjectStatusChartProps) {
  return (
    <Card className="flex flex-col border shadow-sm">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-base">Project Status</CardTitle>
        <CardDescription>Distribution across sites</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square max-h-[220px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="visitors"
              nameKey="status"
              innerRadius={55}
              outerRadius={80}
              strokeWidth={3}
              paddingAngle={3}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalProjects.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-xs font-medium"
                        >
                          PROJECTS
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-3 pt-0 pb-6">
        <div className="flex items-center gap-2 font-medium leading-none text-sm">
          {activeProjects} Active sites requiring attention <Activity className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="grid grid-cols-2 gap-2 w-full text-xs">
          <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.55 0.15 250)" }} /> Active
          </div>
          <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.70 0.15 40)" }} /> Paused
          </div>
          <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.90 0.18 95)" }} /> Completed
          </div>
          <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "oklch(0.65 0 0)" }} /> Planning
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
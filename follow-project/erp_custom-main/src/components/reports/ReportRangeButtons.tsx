"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "../ui/button-group";


export function ReportRangeButtons() {
  const [range, setRange] = React.useState("month");

  return (
    <ButtonGroup className="flex">
      <Button
        variant={range === "month" ? "default" : "outline"}
        onClick={() => setRange("month")}
      >
        This Month
      </Button>

      <Button
        variant={range === "quarter" ? "default" : "outline"}
        onClick={() => setRange("quarter")}
      >
        This Quarter
      </Button>

      <Button
        variant={range === "year" ? "default" : "outline"}
        onClick={() => setRange("year")}
      >
        This Year
      </Button>
    </ButtonGroup>
  );
}

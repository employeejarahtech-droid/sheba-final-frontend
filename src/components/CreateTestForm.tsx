"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectTrigger, SelectItem, SelectValue } from "@/components/ui/select";

export function CreateTestForm({ onCreate }: { onCreate?: (values: any) => void }) {
  const [open, setOpen] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("pending");
  const [score, setScore] = useState(0);

  const handleSubmit = () => {
    const newTest = {
      id: Date.now().toString(),
      name,
      category,
      status,
      score: Number(score),
    };

    if (onCreate) onCreate(newTest);

    // close sheet
    setOpen(false);

    // reset form
    setName("");
    setCategory("");
    setStatus("pending");
    setScore(0);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Trigger Button */}
      <SheetTrigger asChild>
        <Button onClick={() => setOpen(true)}>Create Test</Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[400px] sm:w-[450px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Test</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6 p-4">

          {/* Test Name */}
          <div className="space-y-2">
            <Label>Test Name</Label>
            <Input
              placeholder="Enter test name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Input
              placeholder="Auth, Performance, etc."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Score */}
          <div className="space-y-2">
            <Label>Score</Label>
            <Input
              type="number"
              placeholder="0–100"
              value={score}
              onChange={(e:any) => setScore(e.target.value)}
            />
          </div>

          {/* Submit */}
          <Button className="w-full" onClick={handleSubmit}>
            Create Test
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

'use client';

import { useState, useEffect, FormEvent } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

// Define the shape of a report
type Report = {
  id: string;
  title: string;
  amount: number;
  author: string;
  createdAt: string;
};

// Define the props for our component
interface ReportDashboardProps {
  permissions: string[];
}

export default function ReportDashboard({ permissions }: ReportDashboardProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<Partial<Report> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchReports = async () => {
    setIsLoading(true);
    const response = await fetch('/api/reports');
    if (response.ok) {
      const data = await response.json();
      setReports(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleCreate = () => {
    setCurrentReport({});
    setIsDialogOpen(true);
  };

  const handleEdit = (report: Report) => {
    setCurrentReport(report);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      fetchReports(); // Refresh the list
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const reportData = {
      title: formData.get('title') as string,
      amount: Number(formData.get('amount')),
    };

    const url = currentReport?.id ? `/api/reports/${currentReport.id}` : '/api/reports';
    const method = currentReport?.id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });

    if (response.ok) {
      setIsDialogOpen(false);
      fetchReports(); // Refresh the list
    } else {
      alert('Failed to save report.');
    }
  };

  if (isLoading) {
    return <div>Loading reports...</div>;
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        {permissions.includes('create:reports') && (
          <Button onClick={handleCreate}>Add New Report</Button>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{report.title}</TableCell>
                <TableCell>${report.amount.toFixed(2)}</TableCell>
                <TableCell>{report.author}</TableCell>
                <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                   {permissions.includes('edit:reports') && (
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEdit(report)}>Edit</Button>
                  )}
                  {permissions.includes('delete:reports') && (
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(report.id)}>Delete</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentReport?.id ? 'Edit Report' : 'Create Report'}</DialogTitle>
            <DialogDescription>Fill in the details for the expense report.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" name="title" defaultValue={currentReport?.title} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Amount</Label>
                <Input id="amount" name="amount" type="number" defaultValue={currentReport?.amount} className="col-span-3" required />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
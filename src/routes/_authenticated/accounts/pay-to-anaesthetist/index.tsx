import { createFileRoute } from '@tanstack/react-router';
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { topNav } from '@/data/data';
import { Activity, Calendar, DollarSign, Users } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_authenticated/accounts/pay-to-anaesthetist/')({
    component: PayToAnaesthetistPage,
})

type AnaesthetistPayment = {
    id: string;
    date: string;
    anaesthetistName: string;
    anaesthetistId: string;
    patientName: string;
    procedureType: string;
    procedureFee: number;
    hospitalShare: number;
    anaesthetistShare: number;
    paymentMethod: string;
    paymentStatus: 'paid' | 'pending' | 'partial';
    reference: string;
};

function PayToAnaesthetistPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [anaesthetistId, setAnaesthetistId] = useState('');
    const [patientName, setPatientName] = useState('');
    const [procedureType, setProcedureType] = useState('');
    const [procedureFee, setProcedureFee] = useState('');
    const [hospitalSharePercent, setHospitalSharePercent] = useState('20');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'partial'>('paid');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    const [anaesthetistPayments] = useState<AnaesthetistPayment[]>([
        {
            id: '1',
            date: '2026-01-13',
            anaesthetistName: 'Dr. Sadia Islam',
            anaesthetistId: 'ANS-001',
            patientName: 'Mohammad Ali',
            procedureType: 'General Anaesthesia',
            procedureFee: 15000,
            hospitalShare: 3000,
            anaesthetistShare: 12000,
            paymentMethod: 'Bank Transfer',
            paymentStatus: 'paid',
            reference: 'PAY-ANS-1001',
        },
        {
            id: '2',
            date: '2026-01-13',
            anaesthetistName: 'Dr. Rahim Chowdhury',
            anaesthetistId: 'ANS-002',
            patientName: 'Ayesha Begum',
            procedureType: 'Spinal Anaesthesia',
            procedureFee: 12000,
            hospitalShare: 2400,
            anaesthetistShare: 9600,
            paymentMethod: 'Cash',
            paymentStatus: 'paid',
            reference: 'PAY-ANS-1002',
        },
    ]);

    const calculateShares = () => {
        const fee = parseFloat(procedureFee) || 0;
        const hospitalPercent = parseFloat(hospitalSharePercent) || 0;
        const hospitalAmount = (fee * hospitalPercent) / 100;
        const anaesthetistAmount = fee - hospitalAmount;
        return { hospitalAmount, anaesthetistAmount };
    };

    const { hospitalAmount, anaesthetistAmount } = calculateShares();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Anaesthetist Payment Submitted');
        setAnaesthetistId('');
        setPatientName('');
        setProcedureType('');
        setProcedureFee('');
        setPaymentMethod('');
        setReference('');
        setNotes('');
    };

    const filteredPayments = anaesthetistPayments.filter(payment => payment.date === filterDate);
    const totalProcedureFees = filteredPayments.reduce((sum, payment) => sum + payment.procedureFee, 0);
    const totalAnaesthetistShare = filteredPayments.reduce((sum, payment) => sum + payment.anaesthetistShare, 0);
    const totalHospitalShare = filteredPayments.reduce((sum, payment) => sum + payment.hospitalShare, 0);

    return (
        <>
            <Header fixed>
                <TopNav links={topNav} />
                <div className='ms-auto flex items-center space-x-4'>
                    <Search />
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>
            <Main>
                <div className="space-y-6">
                    <div>
                        <h1 className='text-2xl font-bold tracking-tight'>Payment to Anaesthetist</h1>
                        <p className='text-muted-foreground'>Manage and track anaesthetist payments and revenue sharing</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Procedures</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{filteredPayments.length}</div>
                                <p className="text-xs text-muted-foreground">for selected date</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Procedure Fees</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">৳{totalProcedureFees.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">total collected</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Anaesthetist Share</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">৳{totalAnaesthetistShare.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">to be paid</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Hospital Share</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">৳{totalHospitalShare.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">hospital revenue</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Record Anaesthetist Payment</CardTitle>
                            <CardDescription>Enter procedure details and payment information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Procedure Date</Label>
                                        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="anaesthetist">Anaesthetist</Label>
                                        <Select value={anaesthetistId} onValueChange={setAnaesthetistId} required>
                                            <SelectTrigger id="anaesthetist">
                                                <SelectValue placeholder="Select anaesthetist" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ANS-001">Dr. Sadia Islam (ANS-001)</SelectItem>
                                                <SelectItem value="ANS-002">Dr. Rahim Chowdhury (ANS-002)</SelectItem>
                                                <SelectItem value="ANS-003">Dr. Nusrat Jahan (ANS-003)</SelectItem>
                                                <SelectItem value="ANS-004">Dr. Kamal Hossain (ANS-004)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="patientName">Patient Name</Label>
                                        <Input id="patientName" placeholder="Enter patient name" value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="procedureType">Procedure Type</Label>
                                        <Select value={procedureType} onValueChange={setProcedureType} required>
                                            <SelectTrigger id="procedureType">
                                                <SelectValue placeholder="Select procedure type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="general">General Anaesthesia</SelectItem>
                                                <SelectItem value="spinal">Spinal Anaesthesia</SelectItem>
                                                <SelectItem value="epidural">Epidural Anaesthesia</SelectItem>
                                                <SelectItem value="local">Local Anaesthesia</SelectItem>
                                                <SelectItem value="sedation">Sedation</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <Label className="text-base font-semibold">Fee Distribution</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="procedureFee">Total Procedure Fee (৳)</Label>
                                            <Input id="procedureFee" type="number" placeholder="0.00" value={procedureFee} onChange={(e) => setProcedureFee(e.target.value)} required step="0.01" min="0" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hospitalShare">Hospital Share (%)</Label>
                                            <Input id="hospitalShare" type="number" placeholder="20" value={hospitalSharePercent} onChange={(e) => setHospitalSharePercent(e.target.value)} required step="1" min="0" max="100" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Anaesthetist Share (%)</Label>
                                            <Input type="number" value={100 - parseFloat(hospitalSharePercent || '0')} disabled className="bg-muted" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                        <div>
                                            <Label className="text-sm text-muted-foreground">Hospital Amount</Label>
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">৳{hospitalAmount.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm text-muted-foreground">Anaesthetist Amount</Label>
                                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">৳{anaesthetistAmount.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="paymentMethod">Payment Method</Label>
                                        <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                                            <SelectTrigger id="paymentMethod">
                                                <SelectValue placeholder="Select method" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cash">Cash</SelectItem>
                                                <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="cheque">Cheque</SelectItem>
                                                <SelectItem value="mobile-banking">Mobile Banking</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="paymentStatus">Payment Status</Label>
                                        <Select value={paymentStatus} onValueChange={(value: any) => setPaymentStatus(value)} required>
                                            <SelectTrigger id="paymentStatus">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="paid">Paid</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="partial">Partial</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reference">Reference/Payment No.</Label>
                                        <Input id="reference" placeholder="PAY-ANS-001" value={reference} onChange={(e) => setReference(e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea id="notes" placeholder="Additional notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                                </div>

                                <Separator />

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline">Cancel</Button>
                                    <Button type="submit">Save Payment Record</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Anaesthetist Payment Records</CardTitle>
                                    <CardDescription>View and manage payment history</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="filterDate" className="text-sm">Filter by Date:</Label>
                                    <Input id="filterDate" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-auto" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Anaesthetist</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Procedure</TableHead>
                                        <TableHead className="text-right">Total Fee</TableHead>
                                        <TableHead className="text-right">Hospital</TableHead>
                                        <TableHead className="text-right">Anaesthetist</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPayments.length > 0 ? (
                                        <>
                                            {filteredPayments.map((payment) => (
                                                <TableRow key={payment.id}>
                                                    <TableCell>{payment.date}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{payment.anaesthetistName}</div>
                                                        <div className="text-xs text-muted-foreground">{payment.anaesthetistId}</div>
                                                    </TableCell>
                                                    <TableCell>{payment.patientName}</TableCell>
                                                    <TableCell>{payment.procedureType}</TableCell>
                                                    <TableCell className="text-right font-semibold">৳{payment.procedureFee.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right text-green-600 dark:text-green-400">৳{payment.hospitalShare.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right text-purple-600 dark:text-purple-400">৳{payment.anaesthetistShare.toFixed(2)}</TableCell>
                                                    <TableCell className="text-sm">{payment.paymentMethod}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={payment.paymentStatus === 'paid' ? 'default' : payment.paymentStatus === 'pending' ? 'secondary' : 'outline'}>
                                                            {payment.paymentStatus}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="sm" variant="outline">View</Button>
                                                            <Button size="sm" variant="outline">Edit</Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="font-bold bg-muted/50">
                                                <TableCell colSpan={4} className="text-right">Total</TableCell>
                                                <TableCell className="text-right">৳{totalProcedureFees.toFixed(2)}</TableCell>
                                                <TableCell className="text-right text-green-600 dark:text-green-400">৳{totalHospitalShare.toFixed(2)}</TableCell>
                                                <TableCell className="text-right text-purple-600 dark:text-purple-400">৳{totalAnaesthetistShare.toFixed(2)}</TableCell>
                                                <TableCell colSpan={3}></TableCell>
                                            </TableRow>
                                        </>
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                                                No payment records found for {filterDate}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </Main>
        </>
    );
}

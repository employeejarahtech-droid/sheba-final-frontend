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
import { Calendar, DollarSign, Stethoscope, Users } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_authenticated/accounts/pay-to-consultant/')({
    component: PayToConsultantPage,
})

type ConsultantPayment = {
    id: string;
    date: string;
    consultantName: string;
    consultantId: string;
    patientName: string;
    consultationType: string;
    consultationFee: number;
    hospitalShare: number;
    consultantShare: number;
    paymentMethod: string;
    paymentStatus: 'paid' | 'pending' | 'partial';
    reference: string;
};

function PayToConsultantPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [consultantId, setConsultantId] = useState('');
    const [patientName, setPatientName] = useState('');
    const [consultationType, setConsultationType] = useState('');
    const [consultationFee, setConsultationFee] = useState('');
    const [hospitalSharePercent, setHospitalSharePercent] = useState('25');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'partial'>('paid');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    const [consultantPayments] = useState<ConsultantPayment[]>([
        {
            id: '1',
            date: '2026-01-13',
            consultantName: 'Prof. Dr. Abdul Karim',
            consultantId: 'CNS-001',
            patientName: 'Mohammad Ali',
            consultationType: 'Cardiology Consultation',
            consultationFee: 2000,
            hospitalShare: 500,
            consultantShare: 1500,
            paymentMethod: 'Cash',
            paymentStatus: 'paid',
            reference: 'PAY-CNS-1001',
        },
        {
            id: '2',
            date: '2026-01-13',
            consultantName: 'Dr. Shahana Parveen',
            consultantId: 'CNS-002',
            patientName: 'Ayesha Begum',
            consultationType: 'Gynecology Consultation',
            consultationFee: 1500,
            hospitalShare: 375,
            consultantShare: 1125,
            paymentMethod: 'Mobile Banking',
            paymentStatus: 'paid',
            reference: 'PAY-CNS-1002',
        },
        {
            id: '3',
            date: '2026-01-13',
            consultantName: 'Dr. Rafiqul Islam',
            consultantId: 'CNS-003',
            patientName: 'Rahim Uddin',
            consultationType: 'Neurology Consultation',
            consultationFee: 2500,
            hospitalShare: 625,
            consultantShare: 1875,
            paymentMethod: 'Bank Transfer',
            paymentStatus: 'pending',
            reference: 'PAY-CNS-1003',
        },
    ]);

    const calculateShares = () => {
        const fee = parseFloat(consultationFee) || 0;
        const hospitalPercent = parseFloat(hospitalSharePercent) || 0;
        const hospitalAmount = (fee * hospitalPercent) / 100;
        const consultantAmount = fee - hospitalAmount;
        return { hospitalAmount, consultantAmount };
    };

    const { hospitalAmount, consultantAmount } = calculateShares();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Consultant Payment Submitted');
        setConsultantId('');
        setPatientName('');
        setConsultationType('');
        setConsultationFee('');
        setPaymentMethod('');
        setReference('');
        setNotes('');
    };

    const filteredPayments = consultantPayments.filter(payment => payment.date === filterDate);
    const totalConsultationFees = filteredPayments.reduce((sum, payment) => sum + payment.consultationFee, 0);
    const totalConsultantShare = filteredPayments.reduce((sum, payment) => sum + payment.consultantShare, 0);
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
                        <h1 className='text-2xl font-bold tracking-tight'>Payment to Consultant</h1>
                        <p className='text-muted-foreground'>Manage and track consultant payments and revenue sharing</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{filteredPayments.length}</div>
                                <p className="text-xs text-muted-foreground">for selected date</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Consultation Fees</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">৳{totalConsultationFees.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">total collected</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Consultant Share</CardTitle>
                                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">৳{totalConsultantShare.toFixed(2)}</div>
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
                            <CardTitle>Record Consultant Payment</CardTitle>
                            <CardDescription>Enter consultation details and payment information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Consultation Date</Label>
                                        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="consultant">Consultant</Label>
                                        <Select value={consultantId} onValueChange={setConsultantId} required>
                                            <SelectTrigger id="consultant">
                                                <SelectValue placeholder="Select consultant" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CNS-001">Prof. Dr. Abdul Karim (CNS-001)</SelectItem>
                                                <SelectItem value="CNS-002">Dr. Shahana Parveen (CNS-002)</SelectItem>
                                                <SelectItem value="CNS-003">Dr. Rafiqul Islam (CNS-003)</SelectItem>
                                                <SelectItem value="CNS-004">Dr. Nasima Begum (CNS-004)</SelectItem>
                                                <SelectItem value="CNS-005">Dr. Mizanur Rahman (CNS-005)</SelectItem>
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
                                        <Label htmlFor="consultationType">Consultation Type</Label>
                                        <Select value={consultationType} onValueChange={setConsultationType} required>
                                            <SelectTrigger id="consultationType">
                                                <SelectValue placeholder="Select consultation type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cardiology">Cardiology Consultation</SelectItem>
                                                <SelectItem value="gynecology">Gynecology Consultation</SelectItem>
                                                <SelectItem value="neurology">Neurology Consultation</SelectItem>
                                                <SelectItem value="orthopedics">Orthopedics Consultation</SelectItem>
                                                <SelectItem value="pediatrics">Pediatrics Consultation</SelectItem>
                                                <SelectItem value="general">General Consultation</SelectItem>
                                                <SelectItem value="follow-up">Follow-up Consultation</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <Label className="text-base font-semibold">Fee Distribution</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="consultationFee">Total Consultation Fee (৳)</Label>
                                            <Input id="consultationFee" type="number" placeholder="0.00" value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} required step="0.01" min="0" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hospitalShare">Hospital Share (%)</Label>
                                            <Input id="hospitalShare" type="number" placeholder="25" value={hospitalSharePercent} onChange={(e) => setHospitalSharePercent(e.target.value)} required step="1" min="0" max="100" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Consultant Share (%)</Label>
                                            <Input type="number" value={100 - parseFloat(hospitalSharePercent || '0')} disabled className="bg-muted" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                        <div>
                                            <Label className="text-sm text-muted-foreground">Hospital Amount</Label>
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">৳{hospitalAmount.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm text-muted-foreground">Consultant Amount</Label>
                                            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">৳{consultantAmount.toFixed(2)}</p>
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
                                        <Input id="reference" placeholder="PAY-CNS-001" value={reference} onChange={(e) => setReference(e.target.value)} />
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
                                    <CardTitle>Consultant Payment Records</CardTitle>
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
                                        <TableHead>Consultant</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Consultation</TableHead>
                                        <TableHead className="text-right">Total Fee</TableHead>
                                        <TableHead className="text-right">Hospital</TableHead>
                                        <TableHead className="text-right">Consultant</TableHead>
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
                                                        <div className="font-medium">{payment.consultantName}</div>
                                                        <div className="text-xs text-muted-foreground">{payment.consultantId}</div>
                                                    </TableCell>
                                                    <TableCell>{payment.patientName}</TableCell>
                                                    <TableCell>{payment.consultationType}</TableCell>
                                                    <TableCell className="text-right font-semibold">৳{payment.consultationFee.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right text-green-600 dark:text-green-400">৳{payment.hospitalShare.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right text-cyan-600 dark:text-cyan-400">৳{payment.consultantShare.toFixed(2)}</TableCell>
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
                                                <TableCell className="text-right">৳{totalConsultationFees.toFixed(2)}</TableCell>
                                                <TableCell className="text-right text-green-600 dark:text-green-400">৳{totalHospitalShare.toFixed(2)}</TableCell>
                                                <TableCell className="text-right text-cyan-600 dark:text-cyan-400">৳{totalConsultantShare.toFixed(2)}</TableCell>
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

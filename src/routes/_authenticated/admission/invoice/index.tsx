import { createFileRoute } from '@tanstack/react-router';
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";

export const Route = createFileRoute('/_authenticated/admission/invoice/')({
  component: FinalInvoice,
})

export default function FinalInvoice() {
  return (
    <div className="max-w-3xl mx-auto w-full p-8 bg-white mt-6 print:w-[850px]">

      {/* Header */}
      <div className="mb-6">
        <div className='flex justify-center items-center gap-8'>
          <img
            src="https://i.ibb.co/3R8GSxV/logo.png"
            alt="Clinic Logo"
            className="w-24 mb-2"
          />

          <div className="text-center">
            <h1 className="text-2xl font-bold">SHEBA CLINIC</h1>
            <p className="text-sm mt-1 leading-5">
              Ghoshpara, Hospital Road, Kurigram <br />
              Ph: 61450, 61867, Mobile: 01558-309138
            </p>
          </div>
        </div>
      </div>
      <div className="text-center mb-2">
        <h2 className="text-xl font-semibold underline mt-4">INVOICE</h2>
      </div>

      <hr />

      {/* Patient Information */}
      <div className="grid grid-cols-2 gap-4 text-sm mt-3">
        <div>
          <p>Receipt ID : 4</p>
          <p>Patient’s Name : Nusrat Tasfin Rimki</p>
          <p>Ref. Doctor name : Dr. Self.</p>
          <p>Contact No : — </p>
          <p>Age : 7</p>
        </div>

        <div className="text-right">
          <p>Delivery Date: 01/01/2025</p>
          <p>Date: 01-Jan-2025 &nbsp; 11:37 am</p>
          <p>Sex: Female</p>
        </div>
      </div>

      {/* Test Table */}
      <div className="mt-6">
        <table className="w-full text-sm border">
          <thead>
            <tr className="border">
              <th className="py-2 border text-left px-3 w-10">SL</th>
              <th className="py-2 border text-left px-3">Test Name</th>
              <th className="py-2 border text-center px-3 w-32">Test Charge</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="border px-3 py-2 text-center">1</td>
              <td className="border px-3 py-2">Blood Group</td>
              <td className="border px-3 py-2 text-center">200.00</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals Area */}
      <div className="flex items-center">
        <div className="flex justify-center mt-10">
          <div className="border rounded-lg px-8 py-3 text-xl font-bold">
            Paid
          </div>
        </div>
        <div className="mt-6 text-sm max-w-[250px] w-full ml-auto">
          <div className="flex justify-between py-1">
            <span>Total =</span>
            <span>200.00</span>
          </div>

          <div className="flex justify-between py-1">
            <span>Discount =</span>
            <span>0.00</span>
          </div>

          <div className="flex justify-between py-1">
            <span>Discounted Charge =</span>
            <span>200.00</span>
          </div>

          <div className="flex justify-between py-1 font-semibold">
            <span>Paid =</span>
            <span>200.00</span>
          </div>

          <div className="flex justify-between py-1 font-semibold border-t mt-2 pt-2">
            <span>Due Amount =</span>
            <span>0.00</span>
          </div>
        </div>
      </div>

      {/* Paid Stamp */}

      <p className="text-sm mt-6 italic">Taka in words : &nbsp; Zero Only</p>

      {/* Print & Download Buttons */}
      <div className="flex justify-end gap-3 mt-6 print:hidden">
        <button
          onClick={() => window.print()}
          className="border px-4 py-2 rounded"
        >
          Print
        </button>
        <button className="border px-4 py-2 rounded">
          Download
        </button>
      </div>
    </div>
  );
}


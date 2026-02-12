'use client';
import DashboardShell from "@/components/DashboardShell";

const doc = {
    sellerName: "HOPE INC",
    dba: "HOPE FUNERAL HOME",
    businessType: "Corporation, GA",
    street: "165 CARNEGIE PLACE",
    cityState: "FAYETTEVILLE, GA",
    zip: "30214",
    mailingStreet: "402 WEBB DR",
    mailingCity: "FOREST PARK, GA",
    mailingZip: "30297",
    contactName: "GWENDOLYN WEBB ELLISON",
    contactTitle: "Owner",
    emails: ["hopeellison@outlook.com", "gwendolynwellison@gmail.com"],
    bankName: "SUNTRUST",
    routing: "061000104",
    account: "1000184347317",
    purchasePrice: "$40,000.00",
    initialAmount: "$3,264.44 / Weekly",
    purchasedAmount: "$58,760.00",
    percentage: "10%",
    frequency: "Weekly",
    originationFee: "$2,000.00",
    netFunded: "$38,000.00",
};

export default function Page() {
    return (
        <DashboardShell>
            <div className="flex justify-center">
                <div className="a4">
                    <h1 className="title">Document</h1>

                    <table className="doc-table">
                        <tbody>
                            <tr>
                                <td><b>Seller’s Legal Name</b><br />{doc.sellerName}</td>
                                <td><b>D/B/A</b><br />{doc.dba}</td>
                                <td><b>Form of Business</b><br />{doc.businessType}</td>
                            </tr>

                            <tr>
                                <td><b>Street Address</b><br />{doc.street}</td>
                                <td><b>City, State</b><br />{doc.cityState}</td>
                                <td><b>Zip</b><br />{doc.zip}</td>
                            </tr>

                            <tr>
                                <td><b>Mailing Address</b><br />{doc.mailingStreet}</td>
                                <td><b>City, State</b><br />{doc.mailingCity}</td>
                                <td><b>Zip</b><br />{doc.mailingZip}</td>
                            </tr>

                            <tr>
                                <td><b>Primary Contact Name</b><br />{doc.contactName}</td>
                                <td><b>Primary Contact Title</b><br />{doc.contactTitle}</td>
                                <td>
                                    <b>Primary Contact Email</b><br />
                                    {doc.emails.map((e) => (
                                        <div key={e}>{e}</div>
                                    ))}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <table className="doc-table mt">
                        <tbody>
                            <tr>
                                <td colSpan={3}>
                                    <b>Seller’s Bank Account</b><br />
                                    Name of Bank: {doc.bankName} &nbsp;&nbsp;
                                    ABA/Routing #: {doc.routing} &nbsp;&nbsp;
                                    Checking Account #: {doc.account}
                                </td>
                            </tr>

                            <tr>
                                <td><b>Purchase Price Paid</b><br />{doc.purchasePrice}</td>
                                <td colSpan={2}><b>Initial Periodic Amount</b><br />{doc.initialAmount}</td>
                            </tr>

                            <tr>
                                <td><b>Purchased Amount</b><br />{doc.purchasedAmount}</td>
                                <td><b>Specified Percentage</b><br />{doc.percentage}</td>
                                <td><b>Periodic Frequency</b><br />{doc.frequency}</td>
                            </tr>

                            <tr>
                                <td><b>Origination Fee</b><br />{doc.originationFee}</td>
                                <td colSpan={2}><b>Net Amount Funded</b><br />{doc.netFunded}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Styles */}
            <style jsx>{`
        .a4 {
          width: 210mm;
          min-height: 297mm;
          background: white;
          padding: 10mm;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          font-size: 12px;
          color: #000;
        }

        .title {
          text-align: center;
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 16px;
        }

        .doc-table {
          width: 100%;
          border-collapse: collapse;
        }

        .doc-table td {
          border: 1px solid #000;
          padding: 8px;
          vertical-align: top;
        }

        .mt {
          margin-top: 16px;
        }

        @media print {
          body {
            background: none;
          }
          .a4 {
            box-shadow: none;
            margin: 0;
          }
        }
      `}</style>
        </DashboardShell>
    );
}

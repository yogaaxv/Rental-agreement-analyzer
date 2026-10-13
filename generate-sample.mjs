/**
 * Run this script once to generate a sample rental agreement PDF for testing.
 * Usage: node generate-sample.mjs
 */
import PDFDocument from './backend/node_modules/pdfkit/index.js';
import { createWriteStream } from 'fs';
import { resolve } from 'path';

const OUTPUT = resolve('./sample-rental-agreement.pdf');
const doc = new PDFDocument({ margin: 60, size: 'A4' });
doc.pipe(createWriteStream(OUTPUT));

// ── Helper ────────────────────────────────────────────────────────────────────
const h1 = (t) => doc.font('Helvetica-Bold').fontSize(16).text(t).moveDown(0.4);
const h2 = (t) => doc.font('Helvetica-Bold').fontSize(13).text(t).moveDown(0.3);
const body = (t) => doc.font('Helvetica').fontSize(11).text(t, { align: 'justify' }).moveDown(0.5);
const clause = (n, t) => {
  doc.font('Helvetica-Bold').fontSize(11).text(`${n}.`);
  doc.font('Helvetica').fontSize(11).text(t, { align: 'justify', indent: 20 }).moveDown(0.5);
};

// ── PAGE 1 ────────────────────────────────────────────────────────────────────
h1('RESIDENTIAL RENTAL AGREEMENT');
body(
  'This Residential Rental Agreement ("Agreement") is entered into as of November 1, 2026, ' +
  'by and between:\n\n' +
  'LANDLORD: Mr. Ramesh Kumar, residing at 45, Green Park, New Delhi – 110016\n\n' +
  'TENANT: Ms. Priya Sharma, residing at 12, Lajpat Nagar, New Delhi – 110024\n\n' +
  'For the rental of the premises located at:\n' +
  'Flat No. 3B, Sunrise Apartments, Sector 14, Gurugram, Haryana – 122001 ("Premises").'
);

h2('1. LEASE TERM');
body(
  'The lease term shall commence on November 1, 2026, and shall expire on October 31, 2027, ' +
  'constituting a period of twelve (12) months. Upon expiry, this Agreement may be renewed ' +
  'by mutual written consent of both parties at least thirty (30) days before the end of the term.'
);

h2('2. MONTHLY RENT');
body(
  'The Tenant agrees to pay a monthly rent of Rs. 25,000 (Rupees Twenty-Five Thousand Only) ' +
  'on or before the 5th day of each calendar month. Rent shall be paid by bank transfer to ' +
  'the Landlord\'s account: HDFC Bank, A/C No. 1234567890, IFSC: HDFC0001234. ' +
  'Rent for the first month shall be paid on the date of signing this Agreement.'
);

h2('3. SECURITY DEPOSIT');
body(
  'The Tenant shall pay a security deposit of Rs. 75,000 (Rupees Seventy-Five Thousand Only), ' +
  'equivalent to three (3) months\' rent, prior to taking possession of the Premises. ' +
  'This deposit shall be held by the Landlord and refunded within thirty (30) days of ' +
  'vacating the Premises, subject to deductions for unpaid rent or damages beyond normal wear and tear.'
);

h2('4. LATE PAYMENT');
body(
  'If rent is not received by the 5th of the month, a late fee of Rs. 500 per day shall be ' +
  'charged from the 6th day onwards. If rent remains unpaid for more than fifteen (15) days, ' +
  'the Landlord reserves the right to initiate termination proceedings as per this Agreement.'
);

// ── PAGE 2 ────────────────────────────────────────────────────────────────────
doc.addPage();

h2('5. NOTICE PERIOD AND TERMINATION');
body(
  'Either party may terminate this Agreement by providing two (2) months\' written notice to ' +
  'the other party. In case of early termination by the Tenant before the expiry of the lease ' +
  'term, two months\' rent shall be forfeited from the security deposit as an early termination ' +
  'penalty. The Landlord may terminate this Agreement immediately in the event of non-payment ' +
  'of rent for more than thirty (30) days or breach of any clause herein.'
);

h2('6. MAINTENANCE AND REPAIRS');
body(
  'The Landlord shall be responsible for major structural repairs, plumbing, electrical ' +
  'wiring, and maintenance of common areas. The Tenant shall be responsible for day-to-day ' +
  'maintenance such as replacing light bulbs, minor plumbing repairs costing less than ' +
  'Rs. 1,000, and keeping the Premises clean and in good condition. Any damage caused by ' +
  'the Tenant beyond normal wear and tear shall be repaired at the Tenant\'s expense.'
);

h2('7. UTILITIES');
body(
  'The Tenant shall be responsible for payment of all utility bills including electricity, ' +
  'water, gas, internet, and cable television directly to the respective service providers. ' +
  'Society maintenance charges of Rs. 3,000 per month shall be borne by the Tenant and ' +
  'paid directly to the Residential Welfare Association.'
);

h2('8. RENT ESCALATION');
body(
  'The monthly rent shall be subject to an annual escalation of 8% (Eight Percent) at the ' +
  'time of each renewal of this Agreement. The escalated rent shall be communicated to the ' +
  'Tenant in writing at least thirty (30) days before the renewal date.'
);

// ── PAGE 3 ────────────────────────────────────────────────────────────────────
doc.addPage();

h2('9. USE OF PREMISES');
body(
  'The Premises shall be used solely for residential purposes by the Tenant and members of ' +
  'the Tenant\'s immediate family. Sub-letting, assignment, or allowing any other person to ' +
  'occupy the Premises without the prior written consent of the Landlord is strictly prohibited. ' +
  'Pets are not permitted on the Premises without prior written approval from the Landlord.'
);

h2('10. PROPERTY DAMAGE AND DEDUCTIONS');
body(
  'The Tenant shall maintain the Premises in good condition and shall be liable for any ' +
  'damage caused due to negligence or misuse. Upon vacating, the Premises shall be returned ' +
  'in the same condition as received, subject to fair wear and tear. The cost of repairing ' +
  'any damage beyond normal wear and tear shall be deducted from the security deposit. ' +
  'If the cost of damage exceeds the security deposit, the Tenant shall pay the difference ' +
  'within fifteen (15) days of receiving a written demand.'
);

h2('11. RENEWAL TERMS');
body(
  'This Agreement may be renewed for a further period of twelve (12) months by mutual written ' +
  'consent. Either party must communicate their intention to renew or vacate at least sixty ' +
  '(60) days before the lease expiry date of October 31, 2027. Renewal shall be at the ' +
  'escalated rent as per Clause 8 and subject to any revised terms agreed in writing.'
);

h2('12. DEPOSIT REFUND CONDITIONS');
body(
  'The security deposit of Rs. 75,000 shall be refunded to the Tenant within thirty (30) days ' +
  'of handing over vacant possession of the Premises, after deducting: (a) any unpaid rent or ' +
  'utility bills; (b) cost of repairing damages beyond normal wear and tear; (c) cost of ' +
  'professional cleaning if the Premises are not returned in a clean condition. The Landlord ' +
  'shall provide an itemised statement of deductions, if any.'
);

// ── PAGE 4 ────────────────────────────────────────────────────────────────────
doc.addPage();

h2('13. GENERAL CONDITIONS');
body(
  'This Agreement constitutes the entire understanding between the parties and supersedes all ' +
  'prior negotiations or agreements. Any modifications to this Agreement must be made in ' +
  'writing and signed by both parties. This Agreement shall be governed by the laws of India ' +
  'and the jurisdiction of courts in Gurugram, Haryana.'
);

h2('14. SIGNATURES');
body(
  'IN WITNESS WHEREOF, the parties have executed this Residential Rental Agreement on the ' +
  'date first written above.'
);

doc.moveDown(1);
doc.font('Helvetica-Bold').fontSize(11).text('LANDLORD:', { continued: false });
doc.font('Helvetica').fontSize(11).text('Name: Mr. Ramesh Kumar');
doc.text('Signature: ___________________________');
doc.text('Date: November 1, 2026').moveDown(1.5);

doc.font('Helvetica-Bold').fontSize(11).text('TENANT:', { continued: false });
doc.font('Helvetica').fontSize(11).text('Name: Ms. Priya Sharma');
doc.text('Signature: ___________________________');
doc.text('Date: November 1, 2026').moveDown(1.5);

doc.font('Helvetica-Bold').fontSize(11).text('WITNESS 1:', { continued: false });
doc.font('Helvetica').fontSize(11).text('Name: Mr. Anil Verma');
doc.text('Signature: ___________________________').moveDown(1.5);

doc.font('Helvetica-Bold').fontSize(11).text('WITNESS 2:', { continued: false });
doc.font('Helvetica').fontSize(11).text('Name: Mrs. Sunita Mehta');
doc.text('Signature: ___________________________');

// ── END ───────────────────────────────────────────────────────────────────────
doc.end();
console.log(`✅ Sample rental agreement generated: ${OUTPUT}`);
console.log('Upload this file at http://localhost:5173 to test the analyzer.');

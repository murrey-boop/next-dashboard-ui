import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

const StudentFeesPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/sign-in");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      feeBalances: true,
      feePayments: {
        orderBy: {
          transactionDate: "desc",
        },
      },
    },
  });

  if (!student) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-800">Profile Incomplete</h2>
        </div>
      </div>
    );
  }

  const totalFees = student.feeBalances ? Number(student.feeBalances.totalFees) : 0;
  const amountPaid = student.feeBalances ? Number(student.feeBalances.amountPaid) : 0;
  const balance = totalFees - amountPaid;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Fee Statement</h1>

      {/* Fee Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Fees</p>
          <p className="text-2xl font-bold text-gray-800">
            KES {totalFees.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Amount Paid</p>
          <p className="text-2xl font-bold text-green-600">
            KES {amountPaid.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Balance</p>
          <p
            className={`text-2xl font-bold ${
              balance > 0 ? "text-orange-600" : "text-green-600"
            }`}
          >
            KES {balance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment History</h2>
        {student.feePayments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No payments recorded yet</p>
        ) : (
          <div className="space-y-3">
            {student.feePayments.map((payment) => (
              <div
                key={payment.id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    KES {Number(payment.amount).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(payment.transactionDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    {payment.paymentMethod}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFeesPage;

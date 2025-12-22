'use client'

import Image from 'next/image'

export default function FeeStats() {
  const stats = {
    totalCollected: 2450000,
    totalPending: 850000,
    totalOverdue: 150000,
    collectionRate: 74.2
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className='bg-white p-4 rounded-xl'>
      <div className="flex justify-between items-center mb-4">
        <h1 className='text-lg font-semibold'>Fee Collection</h1>
        <Image src="/moreDark.png" alt="more" width={20} height={20} className="cursor-pointer"/>
      </div>

      <div className="space-y-4">
        {/* Collection Rate */}
        <div className="bg-gradient-to-r from-lamaSky to-lamaPurple p-4 rounded-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800">{stats.collectionRate}%</h2>
            <p className="text-sm text-gray-600 mt-1">Collection Rate</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">Collected</p>
              <h3 className="text-sm font-bold text-green-700">
                {formatCurrency(stats.totalCollected)}
              </h3>
            </div>
            <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
              <span className="text-xl">✓</span>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">Pending</p>
              <h3 className="text-sm font-bold text-yellow-700">
                {formatCurrency(stats.totalPending)}
              </h3>
            </div>
            <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center">
              <span className="text-xl">⏳</span>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">Overdue</p>
              <h3 className="text-sm font-bold text-red-700">
                {formatCurrency(stats.totalOverdue)}
              </h3>
            </div>
            <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center">
              <span className="text-xl">!</span>
            </div>
          </div>
        </div>

        <button className="w-full py-2 text-sm text-white bg-gradient-to-r from-lamaPurple to-lamaSky hover:opacity-90 rounded-lg transition-all font-medium">
          Manage Fees →
        </button>
      </div>
    </div>
  )
}

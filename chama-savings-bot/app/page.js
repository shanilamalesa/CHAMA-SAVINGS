export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Chama Savings Bot
        </h1>
        <p className="text-xl text-gray-700 mb-12">
          A Telegram bot for Kenyan savings groups. Automate contributions, track balances, and manage fines.
        </p>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-4xl mb-4">💰</div>
            <h2 className="text-xl font-bold mb-2">M-Pesa Payments</h2>
            <p className="text-gray-600">
              Members contribute via M-Pesa directly through Telegram
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-bold mb-2">Live Tracking</h2>
            <p className="text-gray-600">
              See who paid, who's late, and group progress in real-time
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-4xl mb-4">⚡</div>
            <h2 className="text-xl font-bold mb-2">Automated Fines</h2>
            <p className="text-gray-600">
              Fines calculated automatically for late contributions
            </p>
          </div>
        </div>

        {/* Setup Steps */}
        <div className="bg-white rounded-lg shadow p-12 mb-12">
          <h2 className="text-2xl font-bold mb-8">Get Started</h2>
          <div className="space-y-6 max-w-2xl mx-auto text-left">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-bold mb-1">Create a Telegram Group</h3>
                <p className="text-gray-600">
                  Create a new Telegram group for your chama members
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold mb-1">Add the Bot</h3>
                <p className="text-gray-600">
                  Add @ChamaSavingsBot to your group (get your own bot from @BotFather)
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-bold mb-1">Setup Your Chama</h3>
                <p className="text-gray-600">
                  Run <code className="bg-gray-100 px-2 py-1">/setup Name Amount CycleDay</code>
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-bold mb-1">Members Join</h3>
                <p className="text-gray-600">
                  Members run <code className="bg-gray-100 px-2 py-1">/join</code> and provide their phone number
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                5
              </div>
              <div>
                <h3 className="font-bold mb-1">Start Contributing</h3>
                <p className="text-gray-600">
                  Members use <code className="bg-gray-100 px-2 py-1">/contribute</code> to pay via M-Pesa
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Commands */}
        <div className="bg-white rounded-lg shadow p-12 mb-12">
          <h2 className="text-2xl font-bold mb-8">Bot Commands</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
            <div>
              <h3 className="font-bold mb-3 text-blue-600">Setup</h3>
              <ul className="space-y-2 text-sm">
                <li><code>/setup Name Amount Day</code> - Create chama</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-3 text-blue-600">Members</h3>
              <ul className="space-y-2 text-sm">
                <li><code>/join</code> - Join a chama</li>
                <li><code>/members</code> - List all members (treasurer)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-3 text-blue-600">Contributions</h3>
              <ul className="space-y-2 text-sm">
                <li><code>/contribute</code> - Make a payment</li>
                <li><code>/balance</code> - Check your balance</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-3 text-blue-600">Status</h3>
              <ul className="space-y-2 text-sm">
                <li><code>/stats</code> - Group progress</li>
                <li><code>/dashboard</code> - Treasurer dashboard</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-gray-600">
          <p>Made with ❤️ for Kenyan chamas</p>
        </div>
      </div>
    </div>
  );
}

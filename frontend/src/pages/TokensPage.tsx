import { useState } from 'react';
import { ArrowRight, ArrowLeft, Copy, Check, Award, DollarSign, CheckCircle, X } from 'lucide-react';
import { useTokenBalance, useTokenHistory, useConvertTokens, useWithdrawTokens } from '../hooks/useApi';
import { useBalanceStore } from '../store';
import { extractErrorMessage } from '../api/client';
import { Button } from '../components/ui/Form';
import { Input } from '../components/ui/Form';
import { Select } from '../components/ui/Form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { cn } from '../utils/cn';
import type { TokenTransaction, Asset } from '../types';

export function TokensPage() {
  const { balance, refetch: refetchBalance } = useTokenBalance();
  const { data: historyData, isLoading: historyLoading } = useTokenHistory({ page: 1, limit: 20 });
  const convertMutation = useConvertTokens();
  const withdrawMutation = useWithdrawTokens();
  const { setBalance } = useBalanceStore();
  const { toast } = useToast();

  const [convertAmount, setConvertAmount] = useState('');
  const [convertAsset, setConvertAsset] = useState<Asset>('MOCK_USDT');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDestination, setWithdrawDestination] = useState('');
  const [convertError, setConvertError] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<'convert' | 'withdraw'>('convert');
  const [copySuccess, setCopySuccess] = useState(false);

  const assetOptions = [
    { value: 'MOCK_USDT', label: 'MOCK_USDT (1 TOK = 100 USDT)' },
    { value: 'MOCK_ETH', label: 'MOCK_ETH (1 TOK = 200 ETH)' },
  ];

  const rates = { MOCK_USDT: 100, MOCK_ETH: 200 };

  const EXAMPLE_DESTINATION = '0x1234567890abcdef1234567890abcdef12345678';

  const shortenAddress = (address: string) =>
    address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;

  const convertAmountValue = parseInt(convertAmount, 10);
  const withdrawAmountValue = parseInt(withdrawAmount, 10);

  const validateAmount = (raw: string, value: number): string | null => {
    if (!raw.trim()) return 'Enter an amount.';
    if (!Number.isFinite(value) || value <= 0) return 'Amount must be at least 1 TOK.';
    if (value > balance) return `Insufficient balance. You have ${balance} TOK.`;
    return null;
  };

  const validateDestination = (raw: string): string | null => {
    if (!raw.trim()) return 'Enter a destination address.';
    if (!/^0x[0-9a-fA-F]{40}$/.test(raw.trim())) {
      return 'Enter a valid address (0x followed by 40 hex characters).';
    }
    return null;
  };

  const convertValidationError = validateAmount(convertAmount, convertAmountValue);
  const withdrawValidationError = validateAmount(withdrawAmount, withdrawAmountValue);
  const destinationValidationError = validateDestination(withdrawDestination);

  const openConvertModal = () => {
    setConvertError(null);
    setConvertAmount('');
    setShowConvertModal(true);
  };

  const openWithdrawModal = () => {
    setWithdrawError(null);
    setWithdrawAmount(balance > 0 ? String(Math.min(10, balance)) : '');
    setWithdrawDestination('');
    setShowWithdrawModal(true);
  };

  const handleConvert = () => {
    if (convertValidationError) {
      setConvertError(convertValidationError);
      return;
    }
    setConvertError(null);

    convertMutation.mutate(
      { toAsset: convertAsset, amount: convertAmountValue },
      {
        onSuccess: (response) => {
          const { txHashMock, balanceAfter } = response.data.data!;
          setLastTxHash(txHashMock);
          setLastAction('convert');
          setShowConvertModal(false);
          setConvertAmount('');
          setBalance(balanceAfter);
          refetchBalance();
          toast({
            type: 'success',
            title: 'Conversion successful',
            message: `Balance after conversion: ${balanceAfter} TOK`,
          });
        },
        onError: (err: unknown) => setConvertError(extractErrorMessage(err, 'Conversion failed')),
      }
    );
  };

  const handleWithdraw = () => {
    if (withdrawValidationError) {
      setWithdrawError(withdrawValidationError);
      return;
    }
    if (destinationValidationError) {
      setWithdrawError(destinationValidationError);
      return;
    }
    setWithdrawError(null);

    const destination = withdrawDestination.trim();

    withdrawMutation.mutate({ amount: withdrawAmountValue, destination }, {
      onSuccess: (response) => {
        const { balanceAfter, txHashMock } = response.data.data!;
        setLastTxHash(txHashMock ?? null);
        setLastAction('withdraw');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setWithdrawDestination('');
        setBalance(balanceAfter);
        refetchBalance();
        toast({
          type: 'success',
          title: 'Withdrawal confirmed',
          message: `${withdrawAmountValue} TOK sent to ${shortenAddress(destination)}. Balance: ${balanceAfter} TOK`,
        });
      },
      onError: (err: unknown) => setWithdrawError(extractErrorMessage(err, 'Withdrawal failed')),
    });
  };

  const handleCopyTxHash = async () => {
    if (lastTxHash) {
      await navigator.clipboard.writeText(lastTxHash);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const typeLabels: Record<string, string> = {
    EARN: 'Earned',
    CONVERT: 'Converted',
    WITHDRAW: 'Withdrawn',
  };

  const sourceLabels: Record<string, string> = {
    AI_USAGE: 'AI Usage',
    MANUAL: 'Manual',
    SYSTEM: 'System',
  };

  const historyColumns = [
    { 
      key: 'createdAt', 
      header: 'Date', 
      className: 'hidden md:table-cell',
      render: (item: TokenTransaction) => new Date(item.createdAt).toLocaleString() 
    },
    { 
      key: 'type', 
      header: 'Type', 
      render: (item: TokenTransaction) => (
        <Badge variant={item.type === 'EARN' ? 'success' : item.type === 'CONVERT' ? 'warning' : 'danger'}>
          {typeLabels[item.type] || item.type}
        </Badge>
      )
    },
    { 
      key: 'source', 
      header: 'Source', 
      className: 'hidden sm:table-cell',
      render: (item: TokenTransaction) => (
        <Badge variant="secondary" size="sm">{sourceLabels[item.source] || item.source}</Badge>
      )
    },
    { 
      key: 'amount', 
      header: 'Amount', 
      render: (item: TokenTransaction) => (
        <span className={cn('font-mono font-medium', item.amount > 0 ? 'text-green-600' : 'text-red-600')}>
          {item.amount > 0 ? '+' : ''}{item.amount} TOK
        </span>
      )
    },
    { 
      key: 'balanceAfter', 
      header: 'Balance', 
      className: 'hidden md:table-cell',
      render: (item: TokenTransaction) => (
        <span className="font-mono">{item.balanceAfter} TOK</span>
      )
    },
    { 
      key: 'destination', 
      header: 'Destination', 
      className: 'hidden md:table-cell',
      render: (item: TokenTransaction) =>
        item.destination ? (
          <span className="font-mono text-sm text-surface-500" title={item.destination}>
            {shortenAddress(item.destination)}
          </span>
        ) : '—'
    },
    { 
      key: 'referenceId', 
      header: 'Ref', 
      className: 'hidden lg:table-cell',
      render: (item: TokenTransaction) => 
        item.referenceId ? (
          <span className="font-mono text-sm text-surface-500">{String(item.referenceId).slice(0, 12)}...</span>
        ) : '—'
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Token Dashboard</h1>
        <p className="text-surface-500 mt-1">Manage your TOK balance and conversions</p>
      </div>

      <Card padding="lg" className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary-600" />
            Token Balance
          </CardTitle>
          <CardDescription>Your current TOK balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center sm:text-left flex-1">
              <p className="text-4xl font-bold text-surface-900">{balance} TOK</p>
              <p className="text-surface-500 mt-1">
                ≈ ${(balance * 0.01).toFixed(2)} USD (mock rate)
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button onClick={openConvertModal} size="lg" className="flex-1 sm:flex-none">
                <ArrowRight className="h-4 w-4 mr-2" />
                Convert
              </Button>
              <Button variant="secondary" onClick={openWithdrawModal} size="lg" className="flex-1 sm:flex-none">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        title="Convert Tokens"
        description="Exchange TOK for mock Web3 assets"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-surface-600 mb-2">Current balance: <strong>{balance} TOK</strong></p>
            <p className="text-xs text-surface-500">Rate: 1 TOK = {convertAsset === 'MOCK_USDT' ? '100 MOCK_USDT' : '200 MOCK_ETH'}</p>
          </div>
          <Input
            label="Amount (TOK)"
            type="number"
            value={convertAmount}
            onChange={(e) => { setConvertAmount(e.target.value); setConvertError(null); }}
            placeholder="Enter amount"
            min="1"
            max={balance}
            error={convertError ?? (convertAmount ? convertValidationError : undefined) ?? undefined}
            helperText={`Available: ${balance} TOK`}
          />
          <Select
            label="Convert to"
            options={assetOptions}
            value={convertAsset}
            onChange={(e) => setConvertAsset(e.target.value as Asset)}
          />
          <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
            <p className="text-sm text-surface-600">You will receive:</p>
            <p className="text-lg font-bold text-primary-600">
              {Number.isFinite(convertAmountValue) && convertAmountValue > 0
                ? (convertAmountValue * rates[convertAsset]).toLocaleString()
                : 0} {convertAsset}
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowConvertModal(false)} disabled={convertMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleConvert}
              disabled={convertMutation.isPending || !!convertValidationError}
              loading={convertMutation.isPending}
            >
              Convert
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="Withdraw Tokens"
        description="Move TOK out of your Tongston wallet (mock on-chain settlement)"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-surface-600 mb-2">Available balance: <strong>{balance} TOK</strong></p>
            <p className="text-xs text-surface-500">Settlement is mocked — no real assets are transferred.</p>
          </div>
          <Input
            label="Amount (TOK)"
            type="number"
            value={withdrawAmount}
            onChange={(e) => { setWithdrawAmount(e.target.value); setWithdrawError(null); }}
            placeholder="Enter amount"
            min="1"
            max={balance}
            error={withdrawError ?? (withdrawAmount ? withdrawValidationError : undefined) ?? undefined}
            helperText={`Enter an amount between 1 and ${balance} TOK`}
          />
          <Input
            label="Destination address"
            value={withdrawDestination}
            onChange={(e) => { setWithdrawDestination(e.target.value); setWithdrawError(null); }}
            placeholder="0x..."
            error={withdrawDestination ? destinationValidationError ?? undefined : undefined}
            helperText="Mock EVM address — 0x followed by 40 hex characters"
            className="font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => { setWithdrawDestination(EXAMPLE_DESTINATION); setWithdrawError(null); }}
            className="self-start text-sm text-primary-600 hover:underline"
          >
            Use example address
          </button>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowWithdrawModal(false)} disabled={withdrawMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleWithdraw}
              disabled={withdrawMutation.isPending || !!withdrawValidationError || !!destinationValidationError}
              loading={withdrawMutation.isPending}
            >
              Withdraw
            </Button>
          </div>
        </div>
      </Modal>

      {lastTxHash && (
        <div className="fixed bottom-4 right-4 left-4 sm:right-4 sm:left-auto z-50 animate-slide-up" role="alert">
          <Card variant="outlined" padding="md" className="max-w-sm w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium text-surface-900 truncate">
                  {lastAction === 'withdraw' ? 'Withdrawal successful!' : 'Conversion successful!'}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setLastTxHash(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 text-xs bg-surface-100 px-2 py-1 rounded font-mono truncate">{lastTxHash}</code>
              <Button size="sm" variant="ghost" onClick={handleCopyTxHash} aria-label={copySuccess ? 'Copied!' : 'Copy tx hash'}>
                {copySuccess ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Card padding="none">
        <CardHeader className="px-6 py-4">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-surface-500" />
            Transaction History
          </CardTitle>
          <CardDescription>Recent token transactions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {historyLoading ? (
            <div className="p-8 space-y-3" role="status" aria-busy="true">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-surface-100 animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <Table
              columns={historyColumns}
              data={historyData?.data || []}
              keyExtractor={(item) => item.id}
              emptyMessage="No transactions yet. Generate a summary to earn tokens!"
              responsive={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

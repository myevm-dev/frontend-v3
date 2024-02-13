/* eslint-disable react-hooks/rules-of-hooks */
'use client'

import {
  ManagedResult,
  TransactionLabels,
} from '@/lib/shared/components/btns/transaction-steps/lib'
import { useEffect } from 'react'
import { usePrepareSendTransaction, useSendTransaction, useWaitForTransaction } from 'wagmi'
import {
  TransactionExecution,
  TransactionSimulation,
  UsePrepareSendTransactionConfig,
} from './contract.types'
import { useOnTransactionConfirmation } from './useOnTransactionConfirmation'
import { useOnTransactionSubmission } from './useOnTransactionSubmission'
import { useNetworkConfig } from '@/lib/config/useNetworkConfig'

export function useManagedSendTransaction(
  labels: TransactionLabels,
  txConfig?: UsePrepareSendTransactionConfig
) {
  const prepareQuery = usePrepareSendTransaction(txConfig)

  const writeQuery = useSendTransaction({
    chainId: txConfig?.chainId,
    ...prepareQuery.config,
  })

  const transactionStatusQuery = useWaitForTransaction({ hash: writeQuery.data?.hash })

  const bundle = {
    simulation: prepareQuery as TransactionSimulation,
    execution: writeQuery as TransactionExecution,
    result: transactionStatusQuery,
  }

  // when the transaction is successfully submitted to the chain
  // start monitoring the hash
  //
  // when the transaction has an execution error, update that within
  // the global transaction cache too
  useEffect(() => {
    if (bundle?.execution?.data?.hash) {
      // add transaction here
    }
  }, [bundle.execution?.data?.hash])

  // when the transaction has an execution error, update that within
  // the global transaction cache
  // this can either be an execution error or a confirmation error
  useEffect(() => {
    if (bundle?.execution?.error) {
      // monitor execution error here
    }
    if (bundle?.result?.error) {
      // monitor confirmation error here
    }
  }, [bundle.execution?.error, bundle.result?.error])

  // on successful submission to chain, add tx to cache
  const { chain } = useNetworkConfig()
  useOnTransactionSubmission({ labels, hash: writeQuery.data?.hash, chain })

  // on confirmation, update tx in tx cache
  useOnTransactionConfirmation({
    labels,
    status: bundle.result.data?.status,
    hash: bundle.result.data?.transactionHash,
  })

  return {
    ...bundle,
    execute: writeQuery.sendTransaction,
    executeAsync: writeQuery.sendTransactionAsync,
  } satisfies ManagedResult
}

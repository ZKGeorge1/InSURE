import { Mina, isReady, PublicKey, fetchAccount } from 'o1js';

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import type { insureZecure, Report, Requirements } from 'C:/Users/samue/insureZecure/contracts/src/insureZecure';

const state = {
  insureZecure: null as null | typeof insureZecure,
  zkapp: null as null | insureZecure,
  transaction: null as null | Transaction,
};

// ---------------------------------------------------------------------------------------

const functions = {
  setActiveInstanceToBerkeley: async (args: {}) => {
    const Berkeley = Mina.Network(
      'https://proxy.berkeley.minaexplorer.com/graphql'
    );
 console.log('Berkeley Instance Created');
    Mina.setActiveInstance(Berkeley)  
  },
  loadContract: async (args: {}) => {
    const { insureZecure } = await import('C:/Users/samue/insureZecure/contracts/src/insureZecure');
    state.insureZecure = insureZecure;
  },
  compileContract: async (args: {}) => {
    await state.insureZecure!.compile();
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkapp = new state.insureZecure!(publicKey);
  },
  getRequirementsHash: async (args: {}) => {
    const currentRequirementsHash = await state.zkapp!.verifiedRequirementsHash.fetch();
    return JSON.stringify(currentRequirementsHash!.toJSON());
  },
  createPublishReportTransaction: async (args: { report: Report }) => {
    const transaction = await Mina.transaction(() => {
      state.zkapp!.publishReport(args.report);
    });
    state.transaction = transaction;
  },
  createPublishInsuranceProofTransaction: async (args: { report: Report, requirements: Requirements }) => {
    const transaction = await Mina.transaction(() => {
      state.zkapp!.publishInsuranceProof(args.report, args.requirements);
    });
    state.transaction = transaction;
  },
  createVerifyInsuranceProofTransaction: async (args: { requirements: Requirements }) => {
    console.log('createVerifyInsuranceProofTransaction: ', args.requirements)
    const transaction = await Mina.transaction(() => {
      state.zkapp!.verifyInsuranceProof(args.requirements);
    });
    state.transaction = transaction;
  },
  proveTransaction: async (args: {}) => {
    await state.transaction!.prove();
  },
  getTransactionJSON: async (args: {}) => {
    return state.transaction!.toJSON();
  },
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
  id: number;
  fn: WorkerFunctions;
  args: any;
};

export type ZkappWorkerReponse = {
  id: number;
  data: any;
};
if (process) {
  addEventListener(
    'message',
    async (event: MessageEvent<ZkappWorkerRequest>) => {
      const returnData = await functions[event.data.fn](event.data.args);

      const message: ZkappWorkerReponse = {
        id: event.data.id,
        data: returnData,
      };
      postMessage(message);
    }
  );
}
console.log('Web Worker Successfully Initialized.');

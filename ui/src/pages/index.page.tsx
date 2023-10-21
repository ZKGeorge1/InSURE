import Sidebar from "@/components/Sidebar";
import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  Mina,
  isReady,
  PublicKey,
  fetchAccount,
  Field,
  Bool,
  Poseidon,
} from 'o1js';
import ZkappWorkerClient from './zkappWorkerClient';
import { Report, Requirements } from 'C:/Users/samue/insureZecure/contracts/src/insureZecure';
import { ReportFormInput, RequirementsFormInput, buildReportFromFormInput, buildRequirementsFromFormInput, reportFromJson, requirementsFromJson } from "@/util";
import NewRequest from "./new-request.page";
import InsuranceProof from "./insure-proof.page";
import VerifyInsuranceProof from "./verify-insure-proof.page";
import './reactCOIServiceWorker';
import styles from '../../../ui/src/styles/Home.module.css';


let transactionFee = 0.1;


export default function NewReport() {
  let [state, setState] = useState({
    zkappWorkerClient: null as null | ZkappWorkerClient,
    hasWallet: null as null | boolean,
    hasBeenSetup: false,
    accountExists: false,
    currentNum: null as null | Field,
    publicKey: null as null | PublicKey,
    zkappPublicKey: null as null | PublicKey,
    creatingTransaction: false,
    hash: ""
  });

  const [displayText, setDisplayText] = useState("");
  const [transactionlink, setTransactionLink] = useState("");
  let [form1output, setForm1output] = useState("")
  let [form2output, setForm2output] = useState("")
  let [form3output, setForm3output] = useState("")
  let [form4output, setForm4output] = useState("")

    async function timeout(seconds: number): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, seconds * 1000);
    });
  }
   useEffect(() => {
    (async () => {
      if (!state.hasBeenSetup) {
        setDisplayText('Loading web worker...');
        console.log('Loading web worker...');
        const zkappWorkerClient = new ZkappWorkerClient();
        await timeout(5);
        console.log('Done loading web worker');

        zkappWorkerClient.setActiveInstanceToBerkeley();

        const mina = (window as any).mina;

        if (mina == null) {
          setState({ ...state, hasWallet: false });
          return;
        }

        const publicKeyBase58: string = (await mina.requestAccounts())[0];
        const publicKey = PublicKey.fromBase58(publicKeyBase58);
        
        console.log('public key: ', publicKey.toBase58());

        console.log('checking if account exists...');

        const res = await fetchAccount({
          publicKey: publicKey!,
        });


        await zkappWorkerClient.loadContract();

        console.log('Compiling zkApp...');
        await zkappWorkerClient.compileContract();
        console.log('zkApp compiled');

        const zkappPublicKey = PublicKey.fromBase58(
          'B62qoEMjuBPUhyqzmvX2hnTfBM1awk7nvXX1mi4e6BQUgpJ6MHWxezN'
        );

        await zkappWorkerClient.initZkappInstance(zkappPublicKey);

        console.log('Getting zkApp state...');
        await zkappWorkerClient.fetchAccount({ publicKey: zkappPublicKey });
        const currentNum = await zkappWorkerClient.getRequirementsHash();
        console.log('READY!')
        doHideOverlay()

        setState({
          ...state,
          zkappWorkerClient,
          hasWallet: true,
          hasBeenSetup: true,
          publicKey,
          zkappPublicKey,
          currentNum,
        });
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (state.hasBeenSetup && !state.accountExists) {
        for (;;) {
          setDisplayText('Checking if fee payer account exists...');
          console.log('Checking if fee payer account exists...');
          const res = await state.zkappWorkerClient!.fetchAccount({
            publicKey: state.publicKey!,
          });
          const accountExists = res.error == null;
          if (accountExists) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
        setState({ ...state, accountExists: true });
      }
    })();
  }, [state.hasBeenSetup]);

  async function publishReport(report: Report) {
    doShowOverlay()
    myLog('Publishing medical report hash...');

    if (state.zkappWorkerClient) {  
      state.zkappWorkerClient!.fetchAccount({ publicKey: state.publicKey!,
});
      
      try {
       await state.zkappWorkerClient.createPublishReportTransaction(report);
       myLog('creating transaction...');
       catch (e)
      }

      myLog('creating proof...');
        await state.zkappWorkerClient!.proveTransaction();

      const transactionJSON = await state.zkappWorkerClient!.getTransactionJSON();

      myLog('requesting send transaction...');
      const { hash } = await (window as any).mina.sendTransaction({
      transaction: transactionJSON,
      feePayer: {
      fee: transactionFee,
      memo: ''}
      })
      
      const transactionLink = `https://berkeley.minaexplorer.com/transaction/${hash}`;
      console.log(`View transaction at ${transactionLink}`);

      setTransactionLink(transactionLink);
    setDisplayText(transactionLink);
    
    setState({ ...state, creatingTransaction: false, hash: hash });
    setForm1output(JSON.stringify(report, null, 2))

    };
  }

  async function publishInsureProof(report: Report, requirements: Requirements) {
    doShowOverlay()

    myLog('Publishing insurance  proof...');

    await state.zkappWorkerClient!.fetchAccount({
      publicKey: state.publicKey!,
    });

    try {

      myLog('creating transaction...');
      await state.zkappWorkerClient!.createPublishInsureProofTransaction(report, requirements);

      myLog('creating proof...');
      await state.zkappWorkerClient!.proveTransaction();

      myLog('getting transaction JSON...');
      const transactionJSON = await state.zkappWorkerClient!.getTransactionJSON();

      myLog('requesting send transaction...');
      var { hash } = await (window as any).mina.sendTransaction({
        transaction: transactionJSON,
        feePayer: {
          fee: transactionFee,
          memo: '',
        },
      });

    } catch (e) {
      alert('failed to generate proof: ' + e)
    }

    myLog(
      'See transaction at https://berkeley.minaexplorer.com/transaction/' + hash
    );
    doHideOverlay()


    setState({ ...state, creatingTransaction: false, hash: hash });
    setForm3output("ok")
  }

  async function publishVerifyInsureProof(requirements: Requirements) {
    doShowOverlay()

    myLog('Verifying insurance proof...');

    await state.zkappWorkerClient!.fetchAccount({
      publicKey: state.publicKey!,
    });

    try {
      const curRequirementsHash = await state.zkappWorkerClient!.getRequirementsHash()
      const expectedRequirementsHash = Poseidon.hash([
        new Field(requirements.patientIdHash),
        new Field(requirements.verifyTime),
        new Bool(requirements.allowConditionA).toField(),
        new Bool(requirements.allowConditionB).toField(),
        new Bool(requirements.allowConditionC).toField(),
      ])

      if (JSON.stringify(curRequirementsHash) != JSON.stringify(expectedRequirementsHash)) {
        alert('FAILED TO VERIFY!')
      } else {
        myLog('Requirements verified!')
        await new Promise(r => setTimeout(r, 2000));
      }



       await state.zkappWorkerClient!.createVerifyInsureProofTransaction(requirements);

       await state.zkappWorkerClient!.proveTransaction();

       myLog('getting transaction JSON...');
       const transactionJSON = await state.zkappWorkerClient!.getTransactionJSON();

       myLog('requesting send transaction...');
       var { hash } = await (window as any).mina.sendTransaction({
         transaction: transactionJSON,
         feePayer: {
           fee: transactionFee,
           memo: '',
         },
       });

    } catch (e) {
      alert('failed to verify proof: ' + e)
    }

     myLog(
       'See transaction at https://berkeley.minaexplorer.com/transaction/' + hash
     );
    doHideOverlay()


     setState({ ...state, creatingTransaction: false, hash: hash });
    setForm4output("ok")
  }

  useEffect(() => {

    const showDoctorBtn = document.getElementById('patientBtn');
    const showInsurerBtn = document.getElementById('insurerBtn');
    const showPatientBtn = document.getElementById('doctorBtn');

    showDoctorBtn?.addEventListener('click', () => {
      toggleVisibility('.doctor');
    });

    showInsurerBtn?.addEventListener('click', () => {
      toggleVisibility('.employer');
    });

    showPatientBtn?.addEventListener('click', () => {
      toggleVisibility('.patient');
    });
      },)

  const toggleVisibility = (visibleClass: any) => {
    const doctorDiv = document.querySelector('.doctor');
    const insurerDiv = document.querySelector('.insurer');
    const patientDiv = document.querySelector('.patient');
  

    doctorDiv?.classList.remove('visible');
    insurerDiv?.classList.remove('visible');
    patientDiv?.classList.remove('visible');

    document.querySelector(visibleClass).classList.add('visible');
  };


  const [patientID, setPatientID] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [condition_1, setCondition_1] = useState("");
  const [condition_2, setCondition_2] = useState("");
  const [condition_3, setCondition_3] = useState("");

  const [showOverlay, setShowOverlay] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  function doShowOverlay() {
    setLogs([])
    setShowOverlay(true)
  }

  function doHideOverlay() {
    setShowOverlay(false)
  }

  const myLog = (...message: any) => {
    console.log(...message)
    setLogs((prevLogs) => [...(prevLogs || []), message]);
  };


  function submitRequest(requirementsInput: RequirementsFormInput) {
    const req = buildRequirementsFromFormInput(requirementsInput)
    setForm2output(JSON.stringify(req, null, 2))
  }

  function submitInsureProof(reportJsonString: string, requirementsJsonString: string) {
    publishInsureProof(reportFromJson(reportJsonString), requirementsFromJson(requirementsJsonString))
  }

  function submitVerifyInsureProof(requirementsJsonString: string) {
    publishVerifyInsureProof(requirementsFromJson(requirementsJsonString))
  }

  // Create UI elements

  let hasWallet;
  if (state.hasWallet != null && !state.hasWallet) {
    const auroLink = 'https://www.aurowallet.com/';
    const auroLinkElem = (
      <a href={auroLink} target="_blank" rel="noreferrer">
        Install Auro wallet here
      </a>
    );
    hasWallet = (
      <div>
        Could not find a wallet. {auroLinkElem}
      </div>
    );
  }

  const stepDisplay = transactionlink ? (
    <a href={displayText} target="_blank" rel="noreferrer">
      View transaction
    </a>
  ) : (
    displayText
  );

  let setup = (
    <div
      className={styles.start}
      style={{ fontWeight: 'bold', fontSize: '1.5rem', paddingBottom: '5rem' }}
    >
      {stepDisplay}
      {hasWallet}
    </div>
  );

  return (
    <div className="App bg-white-50 dark:bg-zinc-900">
      {showOverlay && (
        <div className="overlay">
          <button onClick={doHideOverlay}>Hide</button>
          <div className="overlay-content">
            <ul ><code className="mt-5">
              {logs.map((log, index) => (
                <li key={index}>{log}</li>
              ))}
            </code></ul>
          </div>
        </div>
      )}
      <Sidebar />
      <div className="generate-keys">
        <div className="doctor">
        <h1>Doctor - Report Patient Medical Conditions</h1>

        <form
          className="main-form"
          onSubmit={(e: any) => {
            publishReport(buildReportFromFormInput({
              patientId: patientID,
              validUntil,
              hasConditionA: condition_1,
              hasConditionB: condition_2,
              hasConditionC: condition_3,
            }));


            e.preventDefault();
          }}
        >
          {/* <h2>Christian Adelmund</h2>
          <p className="secondary">hdI4yZ5ew18JH4JW9jbhUFrviQzM7</p> */}
          {/*
          <div className="top-right">
            <button className="secondary">Import</button>
          </div> */}

          <div className="patient-id mt-5">
            <h3>Patient ID</h3>
            <input
              className="appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
              id="condition-1"
              type="text"
              placeholder="123"
              onChange={(e) => {
                setPatientID(e.target.value);
              }}
            ></input>
          </div>

          <div className="datetime mt-5">
            <h3>Valid Until</h3>
            <input
              className="appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
              id="condition-1"
              type="text"
              placeholder="YYYY-MM-DD"
              onChange={(e) => {
                setValidUntil(e.target.value);
              }}
            ></input>
          </div>

          <div className="blood-pressure mt-5">
            <h3>Blood Pressure</h3>
            <input
              className="appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
              id="condition-1"
              type="text"
              placeholder="90"
              onChange={(e) => {
                setBloodPressure(e.target.value);
              }}
            ></input>
          </div>

          <div className="coditions mt-5">
            <h3>Condition #1</h3>
            <input
              className="appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
              id="condition-1"
              type="text"
              placeholder="True"
              onChange={(e) => {
                setCondition_1(e.target.value);
              }}
            ></input>
          </div>

          <div className="coditions mt-5">
            <h3>Condition #2</h3>
            <input
              className="appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
              id="condition-1"
              type="text"
              placeholder="True"
              onChange={(e) => {
                setCondition_2(e.target.value);
              }}
            ></input>
          </div>

          <div className="coditions mt-5">
            <h3>Condition #3</h3>
            <input
              className="appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
              id="condition-1"
              type="text"
              placeholder="True"
              onChange={(e) => {
                setCondition_3(e.target.value);
              }}
            ></input>
          </div>
          <div className='mt-16'>
            <button
              className="button-main right hover:bg-blue-800 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"
              type="submit"
            >
              Generate medical report
            </button>
          </div>
        </form>
        {form1output && (<>
          <h1>Medical report for patient</h1>
          <a className="my-5" href={'https://berkeley.minaexplorer.com/transaction/' + state.hash}><code>{state.hash}</code></a>
          <pre className="bg-gray-100 text-gray-800 p-4 rounded-md overflow-auto shadow-md">
            <code>{form1output}</code>
          </pre>
        </>)}
        </div>

        <div className="insurer">
        <h1>Insurer - Request Insurance Proof from Patient</h1>
        <NewRequest submitRequest={submitRequest} />
        {form2output && (<>
          <h1>Requirements request for patient</h1>
          <pre className="bg-gray-100 text-gray-800 p-4 rounded-md overflow-auto shadow-md">
            <code>{form2output}</code>
          </pre>
        </>)}
        
        <h1>Insurer - Verify Insurance Proof</h1>
        <VerifyInsureProof submitVerifyInsureProof={submitVerifyInsureProof} />
        {form4output && (<>
          <h1>Insurance proof verified!</h1>
          { <a className="my-5" href={'https://berkeley.minaexplorer.com/transaction/' + state.hash}><code>{state.hash}</code></a> }
        </>)}

        </div>

        <div className="patient">
        <h1>Patient - Submit Insurance Proof</h1>
        <InsureProof submitInsureProof={submitInsureProof} />
        {form3output && (<>
          <h1>Insurance proof submitted!</h1>
          <a className="my-5" href={'https://berkeley.minaexplorer.com/transaction/' + state.hash}><code>{state.hash}</code></a>
        </>)}

        <form className="main-form" action="" method="get">
            <h2>Employer Requests</h2>

            <div className="tertiary-group">
                <h4 className="green">PASS</h4>
                <p>Company Name: <span>Fake Starbucks</span></p>
                <p>Insurance: <span></span></p>
                <p>Status: <span className="orange">Not Sent</span></p>

                <button
                className="button-main middle right hover:bg-blue-800 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"
                type="button"
                >
                    ENCRYPT AND PUBLISH
                </button>
            </div>

            <div className="tertiary-group">
                <h4 className="red">NOT PASS</h4>
                <p>Company Name: <span>Fake Starbucks</span></p>
                <p>Insurance: <span></span></p>
                <p>Status: <span className="orange">Not Sent</span></p>

                <button
                className="button-main middle right hover:bg-blue-800 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"
                type="button"
                >
                    ENCRYPT AND PUBLISH
                </button>
            </div>
        </form>

        </div>

        </div>
      </div>


  );

};

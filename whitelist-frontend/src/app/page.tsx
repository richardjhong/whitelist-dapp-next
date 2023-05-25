"use client";

import Head from "next/head";
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { useEffect, useState, useRef } from "react";
import { WHITELIST_CONTRACT_ADDRESS, abi } from "../../constants";

/**
 * Returns a Provider or Signer object representing the Ethereum RPC with or without the
 * signing capabilities of metamask attached
 *
 * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
 *
 * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
 * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
 * request signatures from the user using Signer functions.
 *
 * @param {*} needSigner - True if you need the signer, default false otherwise
 */
const Home = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);
  const web3ModalRef = useRef<Web3Modal | undefined>(undefined);

  const getProviderOrSigner = async (needSigner = false) => {
    if (!web3ModalRef.current) {
      throw new Error("web3ModalRef.current is undefined");
    }

    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 11155111) {
      window.alert("Change the network to Sepolia");
      throw new Error("Change the network to Sepolia");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  /**
   * addAddressToWhitelist: Adds the current connected address to the whitelist
   */
  const addAddressToWhitelist = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer,
      );

      const tx = await whitelistContract.addAddressToWhitelist();
      setLoading(true);

      await tx.wait();
      setLoading(false);

      await getNumberOfWhitelisted();
      setJoinedWhitelist(true);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * getNumberOfWhitelisted:  gets the number of whitelisted addresses
   */
  const getNumberOfWhitelisted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider,
      );

      const _numberOfWhitelisted =
        await whitelistContract.numAddressesWhitelisted();
      setNumberOfWhitelisted(_numberOfWhitelisted);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * checkIfAddressInWhitelist: Checks if the address is in whitelist
   */
  const checkIfAddressInWhitelist = async () => {
    try {
      const signer = await getProviderOrSigner(true) as providers.JsonRpcSigner;
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer,
      );

      const address = await signer.getAddress();
      const _joinedWhitelist = await whitelistContract.whitelistedAddresses(
        address,
      );
      setJoinedWhitelist(_joinedWhitelist);
    } catch (err) {
      console.error(err);
    }
  };

  /*
    connectWallet: Connects the MetaMask wallet
  */
  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);

      checkIfAddressInWhitelist();
      getNumberOfWhitelisted();
    } catch (err) {
      console.error(err);
    }
  };

  /*
    renderButton: Returns a button based on the state of the dApp
  */
  const renderButton = () => {
    if (walletConnected) {
      if (joinedWhitelist) {
        return (
          <div className='text-lg'>Thanks for joining the Whitelist!</div>
        );
      } else if (loading) {
        return (
          <button className='rounded bg-blue-700 border-none text-white text-base p-5 w-52 cursor-pointer mb-2 md:w-full md:flex md:flex-col md:justify-center md:items-center'>
            Loading...
          </button>
        );
      } else {
        return (
          <button
            onClick={addAddressToWhitelist}
            className='rounded bg-blue-700 border-none text-white text-base p-5 w-52 cursor-pointer mb-2 md:w-full md:flex md:flex-col md:justify-center md:items-center'
          >
            Join the Whitelist
          </button>
        );
      }
    } else {
      return (
        <button
          onClick={connectWallet}
          className='rounded bg-blue-700 border-none text-white text-base p-5 w-52 cursor-pointer mb-2 md:w-full md:flex md:flex-col md:justify-center md:items-center'
        >
          Connect your wallet
        </button>
      );
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "sepolia",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnected]);

  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
        <meta
          name='description'
          content='Whitelist-Dapp'
        />
        <link
          rel='icon'
          href='/favicon.ico'
        />
      </Head>
      <div className='min-h-screen flex flex-row justify-center items-center font-mono'>
        <div className="mx-8">
          <h1 className='text-4xl mb-2'>Welcome to Crypto Devs!</h1>
          <div className='text-lg'>
            It&#39;s an NFT collection for developers in Crypto.
          </div>
          <div className='text-lg'>
            {numberOfWhitelisted} have already joined the Whitelist
          </div>
          {renderButton()}
        </div>
        <div>
          <img
            className='w-70 h-50 ml-20'
            src='./crypto-devs.svg'
          />
        </div>
      </div>

      <footer className='flex justify-center items-center py-8 border-t-2 border-gray-300'>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
};

export default Home;

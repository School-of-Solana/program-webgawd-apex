"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, web3, BN, Idl } from "@coral-xyz/anchor";
import { FC, useEffect, useState } from "react";
import idl from "../utils/idl.json";

const PROGRAM_ID = new web3.PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

export const Game: FC = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [clicks, setClicks] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const getProgram = () => {
        if (!wallet.publicKey) return null;
        const provider = new AnchorProvider(connection, wallet as any, {
            preflightCommitment: "processed",
        });
        return new Program(idl as Idl, provider); // Removed PROGRAM_ID arg as it's in IDL or provider? No, Program constructor needs IDL and Provider. IDL usually has address? No.
        // Anchor 0.30 might be different. Let's use standard: new Program(idl, provider)
    };

    const getPda = (publicKey: web3.PublicKey) => {
        return web3.PublicKey.findProgramAddressSync(
            [Buffer.from("user-stats"), publicKey.toBuffer()],
            PROGRAM_ID
        )[0];
    };

    const fetchState = async () => {
        if (!wallet.publicKey) return;
        const program = getProgram();
        if (!program) return;

        try {
            const pda = getPda(wallet.publicKey);
            const account: any = await program.account.userStats.fetch(pda);
            setClicks(account.clicks.toNumber());
        } catch (e) {
            console.log("Account not initialized", e);
            setClicks(null);
        }
    };

    useEffect(() => {
        fetchState();
    }, [wallet.publicKey]);

    const initialize = async () => {
        if (!wallet.publicKey) return;
        setLoading(true);
        try {
            const program = getProgram();
            if (!program) return;
            const pda = getPda(wallet.publicKey);

            await program.methods
                .initialize()
                .accounts({
                    userStats: pda,
                    user: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                } as any)
                .rpc();

            await fetchState();
        } catch (e) {
            console.error(e);
            alert("Error initializing game");
        } finally {
            setLoading(false);
        }
    };

    const click = async () => {
        if (!wallet.publicKey) return;
        setLoading(true);
        try {
            const program = getProgram();
            if (!program) return;
            const pda = getPda(wallet.publicKey);

            await program.methods
                .click()
                .accounts({
                    userStats: pda,
                    user: wallet.publicKey,
                } as any)
                .rpc();

            // Optimistic update or fetch
            await fetchState();
        } catch (e) {
            console.error(e);
            alert("Error clicking");
        } finally {
            setLoading(false);
        }
    };

    if (!wallet.connected) {
        return <div className="text-center p-4">Please connect your wallet to play!</div>;
    }

    return (
        <div className="flex flex-col items-center gap-4 p-8 border rounded-lg bg-gray-800 text-white">
            <h2 className="text-2xl font-bold">Solana Clicker</h2>

            {clicks === null ? (
                <button
                    onClick={initialize}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                    {loading ? "Initializing..." : "Initialize Game"}
                </button>
            ) : (
                <div className="text-center">
                    <p className="text-4xl font-mono mb-4">{clicks}</p>
                    <button
                        onClick={click}
                        disabled={loading}
                        className="px-8 py-4 bg-green-500 rounded-full text-xl font-bold hover:bg-green-600 transform active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? "Clicking..." : "CLICK!"}
                    </button>
                </div>
            )}
        </div>
    );
};

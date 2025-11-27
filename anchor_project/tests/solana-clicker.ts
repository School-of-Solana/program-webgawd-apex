import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaClicker } from "../target/types/solana_clicker";
import { expect } from "chai";

describe("solana-clicker", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.SolanaClicker as Program<SolanaClicker>;
    const user = provider.wallet;

    const [userStatsPda, _] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user-stats"), user.publicKey.toBuffer()],
        program.programId
    );

    it("Is initialized!", async () => {
        // Add your test here.
        try {
            await program.methods
                .initialize()
                .rpc();
        } catch (e) {
            // If already initialized, we might get an error, which is fine for repeated runs
            console.log("Account might be already initialized");
        }

        const account = await program.account.userStats.fetch(userStatsPda);
        expect(account.clicks.toNumber()).to.equal(0);
    });

    it("Clicks!", async () => {
        await program.methods.click().rpc();

        const account = await program.account.userStats.fetch(userStatsPda);
        expect(account.clicks.toNumber()).to.equal(1);
    });

    it("Clicks again!", async () => {
        await program.methods.click().rpc();

        const account = await program.account.userStats.fetch(userStatsPda);
        expect(account.clicks.toNumber()).to.equal(2);
    });
});

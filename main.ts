// get v3 Mango Group
import {
    IDS,
    MangoClient,
    Config,
    I80F48,
    MangoGroup,
    MangoAccount,
    PerpMarket,
    WalletAdapter,
    PerpOrderType,
    makePlacePerpOrderInstruction,
    BookSide,
    BookSideLayout,
    makeConsumeEventsInstruction, Cluster
} from "@blockworks-foundation/mango-client";
import BN from 'bn.js';
import fetch from 'cross-fetch';
import {
    Account,
    AccountInfo,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SimulatedTransactionResponse,
    SystemProgram,
    Transaction,
    TransactionConfirmationStatus,
    TransactionSignature,
} from '@solana/web3.js';

class MyMangoClient {
    private myMangoAccount: MangoAccount;
    private client: MangoClient;
    private mangoProgramIdPk: PublicKey;
    private serumProgramIdPk: PublicKey;

    constructor() {

    }


    async init() {
        const cluster = 'devnet';
        const group = 'devnet.3';
        const myMangoAccountAddress = 'DpDCwU9iihA54hRxyB8DwnKWTrLBPKGea85NurHqjJrz';

        const clusterData = IDS.groups.find((g) => {
            return g.name == group && g.cluster == cluster;
        });

        // console.log(IDS)

        this.mangoProgramIdPk = new PublicKey(clusterData.mangoProgramId);
        this.serumProgramIdPk = new PublicKey(clusterData.serumProgramId);

        const clusterUrl = IDS.cluster_urls[cluster];
        const connection = new Connection(clusterUrl, 'singleGossip');

        const myMangoAccountPubKey = new PublicKey(myMangoAccountAddress);
        this.client = new MangoClient(connection, this.mangoProgramIdPk);
        this.myMangoAccount = await this.client.getMangoAccount(myMangoAccountPubKey, this.serumProgramIdPk);

        // const payer = new Account()


    }

    async placePerpOrder(
        mangoGroup: MangoGroup,
        mangoAccount: MangoAccount,
        perpMarket: PerpMarket,
        owner: Account | WalletAdapter,
        side: 'buy' | 'sell',
        price: number,
        quantity: number,
        orderType?: PerpOrderType,
        clientOrderId = 0,
        // bookSideInfo?: AccountInfo<Buffer>,
        reduceOnly?: boolean,
    ): Promise<TransactionSignature> {
        const [nativePrice, nativeQuantity] = perpMarket.uiToNativePriceQuantity(
            price,
            quantity,
        );
        const transaction = new Transaction();
        const additionalSigners: Account[] = [];

        const instruction = makePlacePerpOrderInstruction(
            this.mangoProgramIdPk,
            mangoGroup.publicKey,
            mangoAccount.publicKey,
            owner.publicKey,
            mangoGroup.mangoCache,
            perpMarket.publicKey,
            perpMarket.bids,
            perpMarket.asks,
            perpMarket.eventQueue,
            mangoAccount.spotOpenOrders,
            nativePrice,
            nativeQuantity,
            new BN(clientOrderId),
            side,
            orderType,
            reduceOnly,
        );
        transaction.add(instruction);

        // if (bookSideInfo) {
        //     const bookSide = bookSideInfo.data
        //         ? new BookSide(
        //             side === 'buy' ? perpMarket.asks : perpMarket.bids,
        //             perpMarket,
        //             BookSideLayout.decode(bookSideInfo.data),
        //         )
        //         : [];
        //     const accounts: Set<string> = new Set();
        //     accounts.add(mangoAccount.publicKey.toBase58());
        //
        //     for (const order of bookSide) {
        //         accounts.add(order.owner.toBase58());
        //         if (accounts.size >= 10) {
        //             break;
        //         }
        //     }
        //
        //     const consumeInstruction = makeConsumeEventsInstruction(
        //         this.mangoProgramIdPk,
        //         mangoGroup.publicKey,
        //         mangoGroup.mangoCache,
        //         perpMarket.publicKey,
        //         perpMarket.eventQueue,
        //         Array.from(accounts)
        //             .map((s) => new PublicKey(s))
        //             .sort(),
        //         new BN(4),
        //     );
        //
        //     transaction.add(consumeInstruction);
        // }

        return await this.client.sendTransaction(transaction, owner, additionalSigners);
    }
}

async function main() {
    var c = new MyMangoClient()
    await c.init()
    // c.placePerpOrder((90, 1))
}

main().then(() => console.log("done"))
import EventEmitter from "/service/ReactNode/controlCenter/database/modules/eventemitter3/dist/index.js";
import merkle from "/modules/merkle-tools/dist/index.js";
import MODULE from './lib/mod.js';
import PEER from './lib/entries/peer.js';
import DATA from './lib/entries/data.js';
import PEERMANAGER from './lib/mappers/peer.js';
import DATAMANAGER from './lib/mappers/data.js';
import CONSENSUS from './lib/entries/consensus.js';
import VALIDATOR from './lib/entries/validator.js';
import ROUNDMANAGER from './lib/mappers/round.js';
import Centralized from './algo/centralized.js';
import ProofOfWorkConsensus from './algo/pow.js';
import ProofOfStakeConsensus from './algo/pos.js';
import DelegatedProofOfWorkConsensus from './algo/static-dpow.js';
import DelegatedProofOfStakeConsensus from './algo/static-dpos.js';
import DynamicDelegateProofOfStakeConsensus from './algo/dynamic-dpos.js';

class APP extends EventEmitter {

    constructor(config) {
        super();
        this.MODULE = MODULE(this);
        this.config = {};
        this.config = Object.assign(this.config, this.getDefaultConfig(), config);

        if (!this.PEER)
            this.PEER = PEER(this);

        if (!this.DATA)
            this.DATA = DATA(this);

        if (!this.PEERMANAGER)
            this.PEERMANAGER = PEERMANAGER(this);

        if (!this.DATAMANAGER)
            this.DATAMANAGER = DATAMANAGER(this);

        if (!this.CONSENSUS)
            this.CONSENSUS = CONSENSUS(this);

        if (!this.VALIDATOR)
            this.VALIDATOR = VALIDATOR(this);

        if (!this.ROUNDMANAGER)
            this.ROUNDMANAGER = ROUNDMANAGER(this);

        this.CONSENSUS.Centralized = Centralized(this);
        this.CONSENSUS.ProofOfWorkConsensus = ProofOfWorkConsensus(this);
        this.CONSENSUS.ProofOfStakeConsensus = ProofOfStakeConsensus(this);
        this.CONSENSUS.DelegatedProofOfWorkConsensus = DelegatedProofOfWorkConsensus(this);
        this.CONSENSUS.DelegatedProofOfStakeConsensus = DelegatedProofOfStakeConsensus(this);
        this.CONSENSUS.DynamicDelegateProofOfStakeConsensus = DynamicDelegateProofOfStakeConsensus(this);
    }
    definePeerClass(man) {
        this.PEER = man;
    }
    definePeerManagerClass(man) {
        this.PEERMANAGER = man;
    }
    setPeerManager(man) {
        this.peerManager = man;
    }
    defineDataClass(man) {
        this.DATA = man;
    }
    defineDataManagerClass(man) {
        this.DATAMANAGER = man;
    }
    setDataManager(man) {
        this.dataManager = man;
    }
    defineConsensusClass(man) {
        this.CONSENSUS = man;
    }
    defineValidatorClass(man) {
        this.VALIDATOR = man;
    }
    defineRoundManagerClass(man) {
        this.ROUNDMANAGER = man;
    }
    setPeerManager(man) {
        this.peerManager = man;
    }
    setRoundManager(man) {
        this.roundManager = man;
    }
    start(consensus) {

        this.emit("app.config", this.config);

        if (!this.peerManager)
            this.peerManager = new this.PEERMANAGER();
        this.emit("app.peermanager");
        if (!this.dataManager)
            this.dataManager = new this.DATAMANAGER();
        this.emit("app.datamanager");
        if (!this.roundManager)
            this.roundManager = new this.ROUNDMANAGER();
        this.emit("app.roundmanager");

        // if (!this.config.algorithm) {
        //        throw new Error('Algorithm of consensus must be defined' );
        // }
        this.initAlgorithm(this.config.algorithm, consensus);
    }

    initAlgorithm(algorithm_name, algoritm_fnc) {

        if (typeof algoritm_fnc == 'string')
            algorithm_name = algoritm_fnc.toString();

        if (algoritm_fnc instanceof Function) {
            this.consensus = new (algoritm_fnc(this));
        } else {
            let cls = null;
            if (algorithm_name == 'ddpos')
                cls = this.CONSENSUS.DynamicDelegateProofOfStakeConsensus;
            if (algorithm_name == 'dpow')
                cls = this.CONSENSUS.DelegatedProofOfWorkConsensus;
            if (algorithm_name == 'dpos')
                cls = this.CONSENSUS.DelegatedProofOfStakeConsensus;//dpow+pos
            if (algorithm_name == 'pow')
                cls = this.CONSENSUS.ProofOfWorkConsensus;
            if (algorithm_name == 'pos')
                cls = this.CONSENSUS.ProofOfStakeConsensus;//pow+pos
            if (algorithm_name == 'centralized')
                cls = this.CONSENSUS.Centralized;
            if (!cls)
                this.consensus = new this.CONSENSUS();
            else
                this.consensus = new cls();
        }

        this.consensus_name = this.consensus.consensus_config_field;
        this.emit("app.selected_consensus", this.consensus_name);
        this.consensus.init();
    }
    getConsensus() {
        return this.consensus;
    }
    getDefaultConfig() {
        return {
            'centralized': {
                'mainNode': '',//public key, only this node can emit new blocks, if you need make centralized with more then 1 node - use delegateMode
                'ignorePrevChilds': true,
            },
            'pow': {
                "premine": 24,//number of height - when premine will stop
                "blockcount": 12, ///number of blocks in target calculation
                "blocktime": 300, //time of one block in seconds
                "maxtarget": 1, //min difficulty
                "excludeFirst": 1, //dont use this numbers blocks in calculation of new target
                "diffWindow": 120, //window of data, used for target
                "diffCut": 6,
                "changeBranchDelay": 0,//The number of blocks that we ignore when sidechain length is bigger then main chain,
                "removeOrphanCount": 100,// the number of blocks after which we remove the old blocks from the lost ones
                'ignorePrevChilds': true,
            },
            'pos': {
                'extends': 'pow',//extending config params from pow section
                'shareStake': 0.1,//max share of stake value that we can decrease from target
            },
            'dpos': {
                'extends': 'pos',
                'delegateMode': true,//new block can emit only public keys from this array
                'delegates': []//if this param is empty - we can make dynamic delegates
            },
            'dpow': {
                'extends': 'pow',
                'delegateMode': true,
                'delegates': []//if this param is empty - we can make dynamic delegates
            },
            'ddpos': {
                'extends': 'dpos',
                'validatorCount': 60,
                'timeout': 60,//timeout in seconds for sending block for validator. If timedout - decrement priority and set cursor to next
                'staticDelegatesLimit': 5,//enable static delegates from config if connected validator count less then this parameter
                'delegates': [],//if this param is empty - we can make dynamic delegates
                "timeout": 60, //max block time after prev block
                "pause": 20,//min block time after prev block
            },
            "genesis": { //need to be rediclared on yours config
                "id": 'genesis',
                "prev": -1,
                "bits": 1,
                "time": 0,
                "nonce": 0,
            }
        };
    }
    merkle(list) {

        function reverseBuffer(buff) {
            var out_rev = Buffer.alloc(buff.length), i = 0
            for (; i < buff.length; i++) {
                out_rev[buff.length - 1 - i] = buff[i];
            }

            return out_rev;
        }

        function makeMerkle(arr) {
            let m = new merkle()
            for (let i in arr) {
                m.addLeaf(reverseBuffer(new Buffer(arr[i].replace('0x', ''), 'hex')).toString('hex'))
            }

            m.makeBTCTree(true);
            return reverseBuffer(new Buffer(m.getMerkleRoot(), 'hex')).toString('hex')
        }

        return makeMerkle(list);
    }

}

export default APP;

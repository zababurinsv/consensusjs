/**
 * Created by vtools on 29.09.2019.
 *
 * Среда выполнения нод (массив нод, алгориты добавления/удаления)
 *
 */
'use strict';

//global.DEBUG_ID="HOT";
//global.DEBUG_ID=9;

//environment
global.CREATE_TX_PER_NODE=1;
//JINN_CONST.MAX_DELTA_PROCESSING=0;
JINN_CONST.MAX_LEADER_COUNT=4;//<--------------------- влияет на трафик по умолчанию

global.LOCAL_RUN=1;
global.MODELING=1;
global.USE_MINING=1;

//JINN_CONST.MAX_CONNECT_TIMEOUT=5;
global.JINN_WARNING=3;
global.DEBUG_TRAFFIC=1;

JINN_CONST.MIN_TIME_SEND_TT_PERIOD=200;
JINN_CONST.MAX_TIME_SEND_TT_PERIOD=500;
JINN_CONST.DELTA_TIME_NEW_BLOCK=200;//иначе не успеваем записать собственные намайненные блоки


JINN_CONST.TEST_DIV_TIMING_HASH=1;
//сеть-ноды



JINN_CONST.MAX_LEVEL_CONNECTION=6;
JINN_CONST.EXTRA_SLOTS_COUNT=4;


//JINN_CONST.MAX_DELTA_BLOCKNUM_POW=20;

//JINN_CONST.MAX_CONNECT_COUNT=20;

global.CreateModel=function (Count,bNoCreate)
{
    var Env=new CTeraEnvironment(Count);
    if(!bNoCreate)
    {
        Env.AddNode(Count,Count);
    }

    //Теперь создаем ноду к которой все будут соединяться...
    var NodeRoot={Num:1000000,ROOT_NODE:1};
    if(global.IP_VERSION===6)
        InitNodeID(NodeRoot,"::",20000);
    else
        InitNodeID(NodeRoot,"127.0.0.1",20000);

    Env.NetNodeMap[NodeRoot.IDStr]=NodeRoot;
    JINN_EXTERN.NodeRoot=NodeRoot;
    global.CreateNodeEngine(NodeRoot);
    NodeRoot.Name="ROOT";



    return Env;
};

function CTeraEnvironment(Count)
{
    var Env=this;
    Env.MaxNodeCount=Count;
    Env.NetNodeArr=[];
    Env.NetNodeMap={};
    Env.NodeCount=0;




    Env.DoRun=function()
    {
        Env.NextTickBlockNum();

        // NextRunEngine(Env.NetNodeArr);
        // NextRunEngine([JINN_EXTERN.NodeRoot]);
        // return;

        for(var n=0;n<Env.NetNodeArr.length;n++)
        {
            var Node=Env.NetNodeArr[n];
            //if(!Node.Del && random(100)<90)
                NextRunEngine(Node);
        }

        NextRunEngine(JINN_EXTERN.NodeRoot);

    };

    Env.AddNode=function(Count)
    {
        //сплошное заполнение
        if(Env.NetNodeArr.length<Env.MaxNodeCount)
        {
            for(var i=0;i<Count;i++)
            {
                if(Env.NetNodeArr.length>=Env.MaxNodeCount)
                    break;
                Env.NewNode(Env.NetNodeArr.length);
            }
        }
    };

    Env.AddNodeHole=function (Count)
    {
        if(!Count)
            return;

        //режим заполнения дырок
        for(var i=1;i<Env.NetNodeArr.length;i++)
        {
            var Node=Env.NetNodeArr[i];
            if(Node.Del)
            {
                var Node2=Env.NewNode(i);
                Node2.Draw=Node.Draw;
                Node2.NeedRedraw=1;
                Node2.New=1;


                Count--;
                if(Count<=0)
                    break;
            }
        }
    };

    Env.NewNode=function(Num)
    {
        var Node={Num:Num};
        global.CreateNodeEngine(Node);

        //console.log(Num,Node.IDStr)


        Env.NetNodeArr[Num]=Node;
        Env.NetNodeMap[Node.IDStr]=Node;
        Env.NodeCount++;
        return Node;
    };


    Env.DeleteNode=function (Count)
    {
        var Arr=[];
        for(var Num=0;Num<Env.NetNodeArr.length;Num++)
        {
            var Node=Env.NetNodeArr[Num];
            if(Node.Num && !Node.Del)//not genesis node
                Arr.push(Node);
        }
        if(!Arr.length)
            return;

        for(var n=0;n<Count;n++)
        {
            var Num=random(Arr.length);

            var Node=Arr[Num];
            Node.Del=1;
            Node.NeedRedraw=1;
            Env.NodeCount--;

            Env.CloseNode(Node);
            Arr.splice(Num,1);
        }
    };

    Env.CloseNode=function(Node)
    {
        //ToLog("Close "+Node.Name);
        for(var i=0;i<Node.ConnectArray.length;i++)
        {
            var Item=Node.ConnectArray[i];
            if(Item.IsOpen())
            {
                var ItemNode=Env.GetNodeByAddr(Item.IDStr);
                if(ItemNode)
                    ItemNode.RemoveConnect(Item);
                //ToLog("Close child "+ItemNode.Name);
            }
        }
        Node.ConnectArray=[];

    };

    Env.GetNodeByAddr=function(IDStr)
    {

        var ItemNode=Env.NetNodeMap[IDStr];
        if(!ItemNode)
        {
            //ToLogTrace("Child error");
            return undefined;
        }


        if(IDStr!==ItemNode.IDStr)
        {
            ToLogTrace("Error IDStr: "+IDStr+" <> "+ItemNode.IDStr)
            return undefined;
        }

        return ItemNode;
    };


    Env.TickCount=0;
    Env.NextTickBlockNum=function()
    {
        Env.TickCount++;
        Env.CurrentBlockNum=JINN_CONST.START_BLOCK_NUM+Math.floor(Env.TickCount/10);
    };

    Env.NextTickBlockNum0=function()
    {
        var Time=Date.now();
        if(Env.CurrentBlockNum===undefined)//init
        {
            Env.CurrentBlockNum=JINN_CONST.START_BLOCK_NUM;
            Env.CurrentBlockNumTime=Time;
        }

        if(Time-Env.CurrentBlockNumTime>=JINN_CONST.CONSENSUS_PERIOD_TIME)
        {
            //next num
            Env.CurrentBlockNum++;
            Env.CurrentBlockNumTime=Time;
            return 1;
        }

        return 0;
    };


    Env.GetCurrentBlockNumByTime=function()
    {
        return Env.CurrentBlockNum;
    };

    JINN_EXTERN.GetCurrentBlockNumByTime=Env.GetCurrentBlockNumByTime;
    //JINN_EXTERN.NetNodeArr=Env.NetNodeArr;
    JINN_EXTERN.GetNodeByAddr=Env.GetNodeByAddr;

    JINN_EXTERN.GetCurrentTickNum=function()
    {
        return Env.TickCount;
    };


    //Init:
    Env.NextTickBlockNum();




    //СТАТИСТИКА

    Env.GetInfoString=function()
    {
        var JinnStat=Env.GetStatPerNode();
        var Str=GetJinnStatInfo(JinnStat);
        return Str;
    };


    Env.GetStatPerNode=function()
    {
        var NodeCount=Env.NodeCount;
        if(!NodeCount)
            NodeCount=1;
        var Stat={};
        for(var key in JINN_STAT)
        {
            var StrType=key.substr(0,3);
            var Value=JINN_STAT[key];
            if(typeof Value==="number")
            {
                if(StrType==="MAX" || StrType==="MIN")
                    Stat[key]=Value;
                else
                    Stat[key]=Math.floor(0.5+Value/NodeCount);
            }
        }
        return Stat;
    }

    Env.CalcMaxConsensusHash=function()
    {

        var Map={};
        var BlockNum=JINN_EXTERN.GetCurrentBlockNumByTime()-JINN_CONST.STEP_LAST;
        var Arr=Env.NetNodeArr;

        for(var i=0;i<Arr.length;i++)
        {
            var Node=Arr[i];
            if(!Node.GetBlockHeaderDB)
                return 0;
            var Block=Node.GetBlockHeaderDB(BlockNum);
            if(Block)
            {
                var StrHash=GetHexFromArr(Block.Hash);
                if(!Map[StrHash])
                    Map[StrHash]=0;
                Map[StrHash]++;
            }
        }

        var MaxHash,MaxValue=0;
        for(var StrHash in Map)
        {
            var Value=Map[StrHash];
            if(Value>MaxValue)
            {
                MaxValue=Value;
                MaxHash=StrHash;
            }
        }

        var ConsensusCount=0;
        for(var i=0;i<Arr.length;i++)
        {
            var Node=Arr[i];
            Node.Err=1;
            var Block=Node.GetBlockHeaderDB(BlockNum);
            //if(Block && MaxHash===GetHexFromArr(Block.Hash))
            if(Node.IsMaxHash(Block))
            {
                ConsensusCount++;
                Node.Err=0;
            }

        }

        return ConsensusCount;
    };

}

global.TO_ERROR_LOG=function (a,b,Str)
{
    ToLog(Str);
}




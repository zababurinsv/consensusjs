/**
 * Created by vtools on 28.09.2019.
 *
 * Базовый класс ноды
 *
 */


'use strict';
global.JINN_MODULES.push({InitClass:InitClass,DoNodeFirst:DoNodeFirst});



//----------------------
//ENG Engine context
//----------------------
var glMaxHashMap={};

function GetMaxHashTickNum(BlockNum)
{
    var Item=glMaxHashMap[BlockNum];
    if(!Item || !Item.StartTick)
        return 0;

    if(!Item.EndTick)
        return -10;

    return Item.EndTick-Item.StartTick;
}


var glNodeID=0;
function InitClass(Engine)
{
    Engine.MaxHashTickMap={};

    Engine.InitModelNode=function ()
    {
        if(Engine.ROOT_NODE)
            return;

        glNodeID++;
        Engine.DirectIP=1;


        var InitIP;
        if(typeof window==="object")
            InitIP="127.0.0.1";
        else
        {
            if(global.IP_VERSION===6)
                InitIP = "::";
            else
                InitIP = "0.0.0.0";
        }

        InitNodeID(Engine,InitIP,20000+glNodeID);

        Engine.Header1=0;
        Engine.Header2=0;
        Engine.Block1=0;
        Engine.Block2=0;


        Engine.Draw={};
        var AddrNum=Engine.IDArr[31]+Engine.IDArr[30]*256;

        Engine.coord3=[0,0,0];
        FillCoord(AddrNum,Engine.coord3,3);
        Engine.coord2=[0,0];
        FillCoord(AddrNum,Engine.coord2,4);



        Engine.Name="NODE "+Engine.ID;

    };


    Engine.CheckMaxHashCreate=function (Block)
    {
        var Item=glMaxHashMap[Block.BlockNum];
        if(!Item)
        {
            Item=
                {
                    PowHash:MAX_ARR_32,
                    StartTick:0,
                    EndTick:0,
                    Miner:0
                };
            glMaxHashMap[Block.BlockNum]=Item;
        }
        if(CompareArr(Block.PowHash,Item.PowHash)<0)
        {
            Item.PowHash=Block.PowHash;
            Item.Miner=Block.Miner;
            Item.Power=Block.Power;
            Item.StartTick=JINN_EXTERN.GetCurrentTickNum();
            return 1;
        }
        else
        {
            return 0;
        }
    };

    Engine.CheckMaxHashReceive=function (Block)
    {
        var Item=glMaxHashMap[Block.BlockNum];
        if(!Item)
            return;

        if(IsEqArr(Block.PowHash,Item.PowHash))
        {
            Item.EndTick=JINN_EXTERN.GetCurrentTickNum();
            Engine.MaxHashTickMap[Block.BlockNum]=Item.EndTick;
        }
    };


    Engine.IsMaxHash=function (Block)
    {
        if(!Block)
            return 0;

        var Item=glMaxHashMap[Block.BlockNum];
        if(!Item)
            return -1;

        if(CompareArr(Block.PowHash,Item.PowHash)!==0)
        {
            return 0;
        }

        return 1;
    };

    Engine.GetMaxHashTickNum=function (BlockNum)
    {
        var Item=glMaxHashMap[BlockNum];
        if(!Item)
            return 0;


        var TickNumEnd=Engine.MaxHashTickMap[BlockNum];
        if(!TickNumEnd || !Item.StartTick)
            return 0;

        return TickNumEnd-Item.StartTick;
    };



    //run
    Engine.InitModelNode();
}

var NumBlockForRndMining=0;
var DoBlockForRndMining=0;
function DoNodeFirst(Engine)
{
    if(Engine.Del)
        return;
    if(Engine.ROOT_NODE)
        return;


    var CurBlockNum=Engine.CurrentBlockNum;//JINN_EXTERN.GetCurrentBlockNumByTime();
    if(Engine.LastCurBlockNumTest!==CurBlockNum)
    {
        Engine.LastCurBlockNumTest=CurBlockNum;


        if(CurBlockNum!==NumBlockForRndMining)
        {
            NumBlockForRndMining=CurBlockNum;
            if(global.glRndTx)
                DoBlockForRndMining=(random(100)<70);
            else
                DoBlockForRndMining=1;
        }


        if(!DoBlockForRndMining)
            return;



        if(global.CREATE_TX_PER_NODE<0)
        {
            if(random(100)<=-global.CREATE_TX_PER_NODE)
                Engine.AddCurrentProcessingTx(CurBlockNum,[Engine.CreateTx({BlockNum:CurBlockNum})]);
        }
        else
        if(global.CREATE_TX_PER_NODE>0)
        {
            //Engine.ToLog(""+CurBlockNum+"  Add tx, was TxCount="+TxCount);
            for(var i=0;i<global.CREATE_TX_PER_NODE;i++)
                Engine.AddCurrentProcessingTx(CurBlockNum,[Engine.CreateTx({BlockNum:CurBlockNum})]);
        }
    }
}


global.FillCoord=function(Value,coord,Bits)
{
    for(var b=0;b<Bits;b++)
    {
        coord[0] |= (Value&1)<<b; Value=Value>>1;
        coord[1] |= (Value&1)<<b; Value=Value>>1;
        if(coord[2]!==undefined)
            coord[2] |= (Value&1)<<b; Value=Value>>1;
    }
}


function InitNodeID(Node,ip,port)
{
    Node.ip=ip;
    Node.port=port;
    Node.IDArr=CalcIDArr(Node.ip,Node.port);

    Node.IDStr=GetHexFromArr(Node.IDArr);

    // Node.RndAddr=random(10000000);
    // Node.PubAddr=sha3("secret:"+random(2000000000));
    //Node.HostName=HostName;
    Node.ID=port%1000;
}



global.InitNodeID=InitNodeID;



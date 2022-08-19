/**
 * Created by vtools on 28.09.2019.
 *
 * Доставка пакетов между нодами (метод Send)
 *
 */
'use strict';
global.JINN_MODULES.push({InitClass:InitClass,DoRun:DoRun,Name:"NetModel"});


var SendBufferArr=[];

//------------------
//common call
//------------------

var glPortNum=50100;
global.glMinLatency=0;


function DoRun()
{
    var CurTime=Date.now();
    var MinPeriod=JINN_CONST.MULT_TIME_PERIOD*global.glMinLatency;//TODO реальное увеличение скорости не равно MULT_TIME_PERIOD - поэтому фактически уменьшается латентность - в итоге неверные результаты

    var Arr=SendBufferArr;
    SendBufferArr=[];//new


    for(var i=0;i<Arr.length;i++)
    {
        var Item = Arr[i];

        var FromNode=Item.FromNode;
        var Child=Item.ToChild.LinkChild;
        if(Item.Mode===1)
        {
            ToNode=JINN_EXTERN.GetNodeByAddr(Item.ToChild.IDStr);
        }
        else
        if(Child)
            ToNode=Child.Node;
        else
            continue;

        var CurMinPeriod=MinPeriod;
        if(global.glUseSplitter)
            CurMinPeriod+=MinPeriod*(Math.abs(ToNode.ID-FromNode.ID)%3);



        if(CurTime-Item.StartTime<CurMinPeriod)//добавляем в массив для вызова в следующий раз
        {
            Item.Skip=1;
            SendBufferArr.push(Item);
            //ToLog("Skip")
        }
        else
        {
            Item.Skip=0;
        }
    }


    for(var i=0;i<Arr.length;i++)
    {
        var Item=Arr[i];
        var ToNode=undefined;

        if(Item.Skip)//пропускаем
            continue;

        if(Item.Mode!==3 && Item.ToChild.Close)
            continue;



        var FromNode=Item.FromNode;

        var Child=Item.ToChild.LinkChild;
        if(Item.Mode===1)
        {
            ToNode=JINN_EXTERN.GetNodeByAddr(Item.ToChild.IDStr);
        }
        else
        if(Child)
            ToNode=Child.Node;
        else
            continue;


        if(ToNode.Del)
        {
            if(Child)
                FromNode.OnDeleteConnect(Child);
            continue;
        }
        if(FromNode.Del)
        {
            continue;
        }

        // if(global.glUseSplitter && !ToNode.ROOT_NODE && !FromNode.ROOT_NODE)
        // {
        //     if(ToNode.ID%2 !== FromNode.ID%2)
        //         continue;
        // }


        if(Item.Mode===1)
        {

            var IDArr=GetRandomBytes(32);

            glPortNum++;
            var Child=ToNode.NewConnect(IDArr,FromNode.ip,glPortNum);
            if(!Child)
                continue;


            Child.InComeConnect=1;
            (ToNode.ID!==0) && Child.ToLogNet("Income connect");
            Child._port=glPortNum;

            FromNode.OnOpenSocket(Item.ToChild,Child);
            ToNode.OnOpenSocket(Child,Item.ToChild);


            Item.F(1);
        }
        else
        if(Item.Mode===3)
        {
            if(!Child)
            {
                ToLogTrace("Child error");
                continue;
            }

            ToNode.OnCloseSocket(Child);
            FromNode.OnCloseSocket(Item.ToChild);
        }
        else
        {
            if(!Child)
            {
                ToLogTrace("Child error");
                continue;
            }

            if(!Child.IsOpen())
            {
                //ToNode.ToError(Child,"Socket not open Mode="+Item.Mode+" HotItem="+JSON.stringify(Child.HotItem),"t");
                continue;
            }
            if(Child.Close)
            {
                ToNode.ToError(Child,"Socket closed","t");
                continue;
            }

            ToNode.ReceiveFromNetwork(Child,Item.Data);
        }
    }
    Arr.length=0;//clear
}


//----------------------
//ENG Engine context
//----------------------

function InitClass(Engine)
{
    Engine.CreateConnectionToChild=function (Child,F)
    {
        if(Child.IsOpen())
        {
            Child.ToError("Socket was opened","t");
            return;
        }

        if(Child.InComeConnect)
        {
            ToLogTrace("CreateConnectionToChild to InComeConnect");
            return;
        }

        var Item={Mode:1,FromNode:Engine, ToChild:Child, F:F, StartTime:Date.now()};
        SendBufferArr.push(Item);
    };

    Engine.CloseConnectionToChild=function (Child)
    {
        if(Child.Close)
        {
            Child.ToError("Socket was closed","t");
            return;
        }
        if(!Child.IsOpen())
        {
            Child.ToError("Socket not was opened","t");
            return;
        }

        var Item={Mode:3,FromNode:Engine, ToChild:Child, StartTime:Date.now()};
        SendBufferArr.push(Item);
    };



    Engine.SENDTONETWORK=function (Child,Data)//переопределяемая в других модулях
    {
        if(Child.Close)
        {
            //Child.ToError("Socket was closed","t");
            return;
        }
        if(!Child.IsOpen())
        {
            //Child.ToError("Socket not open","t");
            return;
        }


        var Item={Mode:2, FromNode:Engine, ToChild:Child, Data:Data, StartTime:Date.now()};
        SendBufferArr.push(Item);
    };


    //эмуляция сокета
    Engine.OnOpenSocket=function (Child,LinkChild)
    {
        Child.LinkChild=LinkChild;
    };
    Engine.OnCloseSocket=function (Child)//переопределяемая в других модулях
    {

        Child.Close=1;
        delete Child.LinkChild;

        Engine.OnDeleteConnect(Child);
    };


    Engine.GetSocketStatus=function(Child)
    {
        if(Child && !Child.Close && Child.LinkChild)
            return 100;
        return 0;
    };

}


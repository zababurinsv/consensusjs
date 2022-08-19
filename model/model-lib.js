/**
 * Created by vtools on 29.09.2019.
*/
'use strict';

//Lib
if(typeof global!=="object")
    global=window;

global.PROCESS_NAME="MAIN";


var nRand=1234567;
function random(max)
{
    nRand=(nRand*1664525+1013904223) >>> 0;
    return nRand % max;
}

function GetArrFromHex(Str)
{
    var array=[];
    for(var i=0;Str && i<Str.length/2;i++)
    {
        array[i]=parseInt(Str.substr(i*2,2),16);
    }
    return array;
}


var HexStr="0123456789ABCDEF";
function GetHexFromArr(arr)
{
    if(arr && !(arr instanceof Array) && arr.data)
        arr=arr.data;

    var Str="";
    if(arr)
    {
        for(var i=0;i<arr.length;i++)
        {
            if(!arr[i])
                Str+="00";
            else
            {
                var Val=arr[i]&255;
                var Index1=(Val>>4)%16;
                var Index2=(Val)%16;
                Str+=HexStr.substr(Index1,1);
                Str+=HexStr.substr(Index2,1);
            }
        }
    }
    return Str;
}

function ClearObject(obj)
{
    //return;
    if(obj.length)
    {
        //if(bClearArr)
        for(var i=0;i<obj.length;i++)
        {
            var value=obj[i];
            obj[i]=undefined;
            if(typeof value==="object")
            {
                //ClearObject(value);
            }
        }
        obj.length=0;
    }
    for (var key in obj)
    {
        var value=obj[key];
        delete obj[key];
        // if(typeof value==="object")
        //     ClearObject(value);
    }
}

function CopyObjKeys(dest,src)
{
    for(var key in src)
    {
        dest[key]=src[key];
    }
    return dest;
}

global.CopyObjKeys=CopyObjKeys;


function GetArrFromMap(Map)
{
    if(!Map)
        return [];

    // if(Array.from)
    //     return Array.from(Map);

    var Arr=[];
    for(var key in Map)
    {
        Arr.push(Map[key]);
    }
    return Arr;
}

function GetStrOnlyTime(now)
{
    if(!now)
        now=new Date();

    var Str=""+now.getHours().toStringZ(2);
    Str=Str+":"+now.getMinutes().toStringZ(2);
    Str=Str+":"+now.getSeconds().toStringZ(2);
    Str=Str+"."+now.getMilliseconds().toStringZ(3);
    return Str;
};

Number.prototype.toStringZ=function(count)
{
    var strnum=this.toString();
    if(strnum.length>count)
        count=strnum.length;
    else
        strnum="0000000000"+strnum;
    return strnum.substring(strnum.length-count,strnum.length);
};

function ToLog(Str)
{
    if(typeof Str==="object" && !(Str instanceof Error))
        console.table(Str);
    else
    {
        var StrTime=GetStrOnlyTime();
        console.log(StrTime + " " + Str);
    }
}

var MapLogOne={};
global.ToLogOne=function (Str,Str2,Level)
{
    //var Data=new Error().stack;
    if(!MapLogOne[Str])
    {
        MapLogOne[Str]=1;
        if(Str2)
            ToLog(Str+Str2,Level);
        else
            ToLog(Str,Level);
    }
};

function WriteUintToArrOnPos(arr,Num,Pos)
{
    arr[Pos]=Num&0xFF;
    arr[Pos+1]=(Num>>>8) & 0xFF;
    arr[Pos+2]=(Num>>>16) & 0xFF;
    arr[Pos+3]=(Num>>>24) & 0xFF;

    var NumH=Math.floor(Num/4294967296);
    arr[Pos+4]=NumH&0xFF;
    arr[Pos+5]=(NumH>>>8) & 0xFF;
}
function WriteUintToArr(arr,Num)
{
    var len=arr.length;
    arr[len]=Num&0xFF;
    arr[len+1]=(Num>>>8) & 0xFF;
    arr[len+2]=(Num>>>16) & 0xFF;
    arr[len+3]=(Num>>>24) & 0xFF;

    var NumH=Math.floor(Num/4294967296);
    arr[len+4]=NumH&0xFF;
    arr[len+5]=(NumH>>>8) & 0xFF;
}
function WriteUint32ToArr(arr,Num)
{
    var len=arr.length;
    arr[len]=Num&0xFF;
    arr[len+1]=(Num>>>8) & 0xFF;
    arr[len+2]=(Num>>>16) & 0xFF;
    arr[len+3]=(Num>>>24) & 0xFF;
}
function WriteUint32ToArrOnPos(arr,Num,Pos)
{
    arr[Pos]=Num&0xFF;
    arr[Pos+1]=(Num>>>8) & 0xFF;
    arr[Pos+2]=(Num>>>16) & 0xFF;
    arr[Pos+3]=(Num>>>24) & 0xFF;
}
function WriteArrToArr(arr,arr2,ConstLength)
{
    var len=arr.length;
    for(var i=0;i<ConstLength;i++)
    {
        arr[len+i]=arr2[i];
    }
}
function ReadUintFromArr(arr,len)
{
    if(len===undefined)
    {
        len=arr.len;
        arr.len+=6;
    }

    var value=(arr[len+5]<<23)*2 + (arr[len+4]<<16)  + (arr[len+3]<<8) + arr[len+2];
    value=value*256 + arr[len+1];
    value=value*256 + arr[len];
    return value;
}



function IsZeroArr(arr)
{
    if(!arr)
    {
        ToLogTrace("IsZeroArr Error arr");
        throw "IsZeroArr Error arr";
    }

    if(arr)
        for(var i=0;i<arr.length;i++)
        {
            if(arr[i])
                return false;
        }
    return true;
}
function CompareArr(a,b)
{
    if(!a)
    {
        ToLogTrace("CompareArr Error arr");
        throw "CompareArr Error a";
    }
    if(!b)
    {
        ToLogTrace("CompareArr Error arr");
        throw "CompareArr Error b";
    }

    for(var i=0;i<a.length;i++)
    {
        if(a[i]!==b[i])
            return a[i]-b[i];
    }
    return 0;
}

function IsEqArr(a,b)
{
    if(!a)
    {
        ToLogTrace("IsEqArr Error array a");
        throw "IsEqArr Error a";
    }
    if(!b)
    {
        ToLogTrace("IsEqArr Error array b");
        throw "IsEqArr Error b";
    }

    if(a.length!==b.length)
        return 0;

    return (CompareArr(a,b)===0)?1:0;
}


function GetRandomBytes(Count)
{
    if(typeof window === "object")
    {
        var arr = new Uint8Array(Count);
        return window.crypto.getRandomValues(arr);
    }
    else
    {
        return require('crypto').randomBytes(Count);
    }
}


function GetPowPower(arrhash)
{
    var SumBit=0;
    for(var i=0;i<arrhash.length;i++)
    {
        var byte=arrhash[i];
        for(var b=7;b>=0;b--)
        {
            if((byte>>b) & 1)
            {


                return SumBit;
            }
            else
            {
                SumBit++;
            }
        }
    }
    return SumBit;
}


function GetArrFromValue(Num)
{
    var arr=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    arr[0]=Num&0xFF;
    arr[1]=(Num>>>8) & 0xFF;
    arr[2]=(Num>>>16) & 0xFF;
    arr[3]=(Num>>>24) & 0xFF;

    var NumH=Math.floor(Num/4294967296);
    arr[4]=NumH&0xFF;
    arr[5]=(NumH>>>8) & 0xFF;

    return arr;
}



function SetBit(Sum,BitNum)
{
    Sum = (Sum>>>0) | (1<<BitNum);
    return Sum;
}

function GetBit(Sum,BitNum)
{
    if(!Sum)
        return 0;
    return (Sum>>>0) & (1<<BitNum);
}

function ResetBit(Sum,BitNum)
{
    Sum = ((Sum>>>0) | (1<<BitNum)) ^ (1<<BitNum);
    // if(GetBit(Sum,BitNum))
    // {
    //     ToLog("**********Error ResetBit=" + BitNum);
    // }

    return Sum;
}


global.SetBit=SetBit;
global.GetBit=GetBit;
global.ResetBit=ResetBit;


global.GetPowPower=GetPowPower;
global.GetRandomBytes=GetRandomBytes;


global.IsZeroArr=IsZeroArr;
global.IsEqArr=IsEqArr;


global.random=random;
global.ToLog=ToLog;
global.ToLogOne=ToLogOne;

global.GetArrFromMap=GetArrFromMap;
global.WriteUintToArr=WriteUintToArr;
global.WriteUint32ToArr=WriteUint32ToArr;
global.WriteUint32ToArrOnPos=WriteUint32ToArrOnPos;
global.WriteArrToArr=WriteArrToArr;
global.WriteUintToArrOnPos=WriteUintToArrOnPos;
global.ReadUintFromArr=ReadUintFromArr;
global.GetArrFromValue=GetArrFromValue;

global.GetArrFromHex=GetArrFromHex;
global.GetHexFromArr=GetHexFromArr;
global.CompareArr=CompareArr;
global.ClearObject=ClearObject;



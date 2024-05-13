/* eslint-disable prefer-const */
import { assert } from "console";
import xlsx from "node-xlsx";
import { Uint, Web3 } from "web3";

import tokenDistributor from "../artifacts/contracts/TokenDistributor.sol/TokenDistributor.json";
import myToken from "../artifacts/contracts/tokens/MyToken.sol/MyToken.json";

const tokenDistributorAddress = "0xbFb51a30B14B704f4c766a9a697728cDEd0AD155";
const myTokenAddress = "0x52babC7A1C1a88665bF06F909E0eD67B5D8213A5";

function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

let genAccountAndAmount = async (addressArray: string[], amountArray: number[]) => {
  var sheets = xlsx.parse("public/upload/file-eth.xls");
  // console.log(sheets[0].data); // 第一张表的数据
  var arr = []; // 全部表数据
  sheets.forEach((sheet) => {
    //sheet是一个json对象，格式为{name:"测试参数",data:[]},我们想要的数据就存储在data里
    for (var i = 1; i < sheet["data"].length; i++) {
      //excel文件里的表格一般有标题所以不一定从0开始
      var row = sheet["data"][i]; // 获取行数据
      if (row && row.length > 0) {
        addressArray.push(row[0]);
        amountArray.push(row[1]);
        // newSheetsArr.push 多表数据隔离用这个
      }
    }
  });
};
// Same as `abi.encodePacked` in Solidity
let setReception = async (tokenDistributorAddress: string, myTokenAddress: string) => {
  let nonce = 0;
  const web3 = new Web3("https://rpctest.filenova.org");

  const distributorContract = new web3.eth.Contract(tokenDistributor.abi, tokenDistributorAddress);
  const myTokenContract = new web3.eth.Contract(myToken.abi, myTokenAddress);
  // 地址为测试网地址
  let addressArray: string[] = [];
  let amountArray: number[] = [];
  await genAccountAndAmount(addressArray, amountArray);
  console.log("addressSplit.length is:", addressArray.length);
  console.log("amountArray.amountSplit is:", amountArray.length);
  // for (let i = 0; i < 1000; i++) {
  //   const account = web3.eth.accounts.create();
  //   addressArray.push(account.address);
  //   amountArray.push(i);
  // }

  // //增发货币给合约
  // let mintTxn = await web3.eth.accounts.signTransaction(
  //   {
  //     gasPrice: "31000",
  //     from: "0x5E468CCB74407F6ed173691dA4fB034661Ca864b",
  //     to: myTokenAddress,
  //     data: myTokenContract.methods.mint(tokenDistributorAddress, 1000000000000000000n).encodeABI(),
  //   },
  //   "0x34bf5b32d66cce9d8ab020ce2a9bb8db67e7f84b040766f3fd3817d6bd8a6a07",
  // );

  // // web3.eth.getTransactionCount(mintTxn);

  // // 发送
  // web3.eth
  //   .sendSignedTransaction(mintTxn.rawTransaction)
  //   .on("transactionHash", function (hash) {
  //     console.log("发送成功,获取交易hash:", hash);
  //   })
  //   .on("receipt", function (receipt) {
  //     console.log("链上结果返回，返回数据：", receipt);
  //   });

  // .on("confirmation", function (confirmationNumber: any, receipt: any) {
  //   console.log("链上confirmation结果返回,确认数:", confirmationNumber);
  //   console.log("链上confirmation结果返回,返回数据:", receipt);
  // })
  // .on("error", console.error);

  sleep(5000);
  let balanceOf = await myTokenContract.methods.balanceOf(tokenDistributorAddress).call();
  console.log("balanceOf is :", balanceOf);

  // console.log("amountArray.splice(0,2000)", amountArray.splice(0, 3000));
  // console.log("addressArray.splice(0,2000)", addressArray.splice(0, 3000));
  assert(addressArray.length === amountArray.length, "length is correct!");
  console.log("addressArray.length / 500 is:", addressArray.length / 500);
  const length = addressArray.length / 500;
  let confirm = false;
  let getNonce = false;
  for (let j = 0; j < length; j++) {
    if (nonce != 0) {
      console.log("j ----------------------------- is:", j);
      confirm = false;
      getNonce = false;
      // 调用合约，写入数据
      let addressSplit = addressArray.splice(0, 500);
      let amountSplit = amountArray.splice(0, 500);
      console.log("addressSplit.length is:", addressSplit.length);
      console.log("amountSplit.length is:", amountSplit.length);
      let txn = await web3.eth.accounts.signTransaction(
        {
          gasPrice: "31000",
          from: "0x5E468CCB74407F6ed173691dA4fB034661Ca864b",
          to: tokenDistributorAddress,
          data: distributorContract.methods.setRecipients(addressSplit, amountSplit).encodeABI(),
          nonce,
        },
        "0x34bf5b32d66cce9d8ab020ce2a9bb8db67e7f84b040766f3fd3817d6bd8a6a07",
      );

      let event = await web3.eth.sendSignedTransaction(txn.rawTransaction);
      let transactionHash = event.transactionHash;
      // 发送
      // web3.eth
      //   .sendSignedTransaction(txn.rawTransaction)
      //   .on("transactionHash", function (hash) {
      //     console.log("发送成功,获取交易hash:", hash);
      //   })
      //   // .on("receipt", function (receipt) {
      //   //   console.log("链上结果返回，返回数据：", receipt);
      //   // })
      //   .on("confirmation", function (reception: any) {
      //     // console.log("链上confirmation结果返回,确认数:", reception);
      //     confirm = true;
      //   })
      //   .on("error", (err) => {
      //     console.log(err.innerError);
      //   });
      while (!getNonce) {
        sleep(5000);
        let transaction = await web3.eth.getTransaction(transactionHash);
        console.log("transaction.nonce is:", transaction.nonce);
        nonce = parseInt(transaction.nonce) + 1;
        getNonce = true;
      }
    } else {
      console.log("j +++++++++++++++++++++++++ is:", j);
      // 调用合约，写入数据
      let txn = await web3.eth.accounts.signTransaction(
        {
          gasPrice: "31000",
          from: "0x5E468CCB74407F6ed173691dA4fB034661Ca864b",
          to: tokenDistributorAddress,
          data: distributorContract.methods
            .setRecipients(addressArray.splice(0, 500), amountArray.splice(0, 500))
            .encodeABI(),
        },
        "0x34bf5b32d66cce9d8ab020ce2a9bb8db67e7f84b040766f3fd3817d6bd8a6a07",
      );

      let event = await web3.eth.sendSignedTransaction(txn.rawTransaction);
      let transactionHash = event.transactionHash;
      console.log("transactionHash is:", transactionHash);
      // 发送
      // web3.eth
      //   .sendSignedTransaction(txn.rawTransaction)
      //   .on("transactionHash", function (hash) {
      //     console.log("发送成功,获取交易hash:", hash);
      //     web3.eth.getTransaction(hash).then((transaction) => {
      //       console.log("transaction.nonce is:", transaction.nonce);
      //       nonce = parseInt(transaction.nonce) + 1;
      //       getNonce = true;
      //     });
      //   })
      //   // .on("receipt", function (receipt) {
      //   //   console.log("链上结果返回，返回数据：", receipt);
      //   // })
      //   .on("confirmation", function (reception: any) {
      //     console.log("链上confirmation结果返回,确认数:", reception);
      //     confirm = true;
      //   })
      //   .on("error", (err) => {
      //     console.log(err.innerError);
      //   });

      while (!getNonce) {
        sleep(5000);
        let transaction = await web3.eth.getTransaction(transactionHash);
        console.log("transaction.nonce is:", transaction.nonce);
        nonce = parseInt(transaction.nonce) + 1;
        getNonce = true;
      }
    }
  }
  let totalClaimable = await distributorContract.methods.totalClaimable().call();
  console.log("totalClaimable is :", totalClaimable);
  let claimableTokenSize = await distributorContract.methods.getMappingLength().call();
  console.log("claimableTokenSize is :", claimableTokenSize);
};
let promise = setReception(tokenDistributorAddress, myTokenAddress);
promise.then(() => {
  console.log("end");
});

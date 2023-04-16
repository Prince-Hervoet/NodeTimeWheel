import { TimeTask, TimeWheel } from "./struct.js";

const w = new TimeWheel();
w.setCellCount(5).setGranularity(3000).setMaxTaskSize(1000);
w.start();

const test: TimeTask = {
  callback: (data: any) => {
    console.log("我被执行了");
    return {};
  },
};
const j = w.add(test, 9812);
console.log(j);

import { LessTaskQueue } from "./lessTaskQueue.js";
import { nanoid } from "nanoid";

export interface TimeTask {
  callback(data: any): any;
}

export class TimeWheel {
  // 格子数量
  private cellCount: number = 0;
  // 当前所在格子
  private currentCellIndex: number = 0;
  // 时间粒度
  private granularity: number = 0;
  // 启动时间
  private startTimestamp: number;
  // 轮次
  private tick: number = 0;
  // 当前任务数量
  private taskSize: number;
  // 最大任务数量
  private maxTaskSize: number;
  // 任务队列
  private taskQueues: LessTaskQueue<WheelTimeTask>[] = [];
  private idToTask: Map<string, WheelTimeTask>;
  private timerId: number = -1;

  constructor() {}

  add = (task: TimeTask, setTime: number) => {
    if (this.taskSize === this.maxTaskSize || !task || setTime <= 0) {
      return "-1";
    }
    const now = new Date().getTime();
    const need = Math.ceil(
      (now + setTime - this.startTimestamp) / this.granularity
    );
    const temp = need / this.cellCount;
    const tick = Math.floor(temp);
    const cellIndex = need - tick * this.cellCount;
    const taskId = nanoid();
    const taskPackage: WheelTimeTask = {
      id: taskId,
      task,
      willUpdateAt: now + setTime,
      tick,
      deleted: false,
    };
    this.taskQueues[cellIndex].add(taskPackage);
    ++this.taskSize;
    this.idToTask[taskId] = taskPackage;
    return taskId;
  };

  quitTask = (taskId: string) => {
    if (!taskId) {
      return;
    }
    const value = this.idToTask[taskId];
    if (value) {
      value.deleted = true;
    }
  };

  size = () => {
    return this.taskSize;
  };

  start = () => {
    if (
      this.cellCount === 0 ||
      this.granularity === 0 ||
      this.maxTaskSize === 0
    ) {
      return;
    }
    for (let i = 0; i < this.cellCount; i++) {
      this.taskQueues.push(
        new LessTaskQueue((a: WheelTimeTask, b: WheelTimeTask) => {
          if (a.tick > b.tick) {
            return 1;
          } else if (a.tick < b.tick) {
            return -1;
          } else {
            if (a.willUpdateAt > b.willUpdateAt) {
              return 1;
            } else if (a.willUpdateAt < b.willUpdateAt) {
              return -1;
            } else {
              return 0;
            }
          }
        })
      );
    }
    this.idToTask = new Map<string, WheelTimeTask>();
    this.solveTaskInQueue();
    this.timerId = setInterval(() => {
      ++this.currentCellIndex;
      if (this.currentCellIndex === this.cellCount) {
        this.currentCellIndex = 0;
        ++this.tick;
      }
      this.solveTaskInQueue();
    }, this.granularity);
    this.startTimestamp = new Date().getTime();
  };

  stop = () => {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
    this.taskQueues.forEach((taskQueue) => {
      while (!taskQueue.isEmpty()) {
        const ele = taskQueue.poll();
        if (!ele?.deleted) {
          ele?.task.callback(ele.task);
        }
      }
    });
    for (let i = 0; i < this.taskQueues.length; i++) {
      this.taskQueues.pop();
    }
  };

  private solveTaskInQueue = () => {
    const queue = this.taskQueues[this.currentCellIndex];
    while (!queue.isEmpty()) {
      const needTick = queue.peek()?.tick ?? -1;
      if (needTick === -1 || needTick > this.tick) {
        break;
      }
      const ele = queue.poll()!;
      this.idToTask.delete(ele.id);
      --this.taskSize;
      if (ele.deleted) {
        continue;
      }
      ele.task.callback(ele.task);
    }
  };

  setCellCount = (count: number) => {
    this.cellCount = count;
    return this;
  };

  setGranularity = (granularity: number) => {
    this.granularity = granularity;
    return this;
  };

  setMaxTaskSize = (size: number) => {
    this.maxTaskSize = size;
    return this;
  };
}

class WheelTimeTask {
  id: string;
  task: TimeTask;
  willUpdateAt: number;
  tick: number;
  deleted: boolean;
}

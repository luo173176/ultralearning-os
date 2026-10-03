// 演示数据：Python 数据分析 60 天。运行 pnpm db:seed；已存在则跳过。
import { PrismaClient } from "@prisma/client";

import { PRINCIPLES } from "../lib/principles";

const db = new PrismaClient();

async function main() {
  const existing = await db.project.findFirst({
    where: { name: "Python 数据分析 60 天" },
  });
  if (existing) {
    console.log("演示项目已存在，跳过 seed");
    return;
  }

  const plannedHours = 60;
  await db.project.create({
    data: {
      name: "Python 数据分析 60 天",
      category: "CODING",
      why: "工作上每天面对报表，想自己动手做分析，而不是等人排期。",
      what: "能独立完成一次完整的数据分析：拿到一份脏数据，完成清洗、可视化，并写出带结论的分析报告。",
      how: "以真实工作数据做项目式直接练习为主，每周产出一份分析报告；卡壳的知识点用钻练补；核心 API 做成闪卡定期复习。",
      plannedHours,
      researchBudget: Math.ceil(plannedHours * 0.1),
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      topicItems: {
        create: [
          { name: "DataFrame 与 Series 的区别", kind: "CONCEPT", mastery: 1 },
          { name: "Pandas 索引与切片规则", kind: "CONCEPT", mastery: 0 },
          { name: "常见统计指标的适用场景", kind: "CONCEPT", mastery: 0 },
          { name: "常用函数的参数与默认值", kind: "FACT", mastery: 0 },
          { name: "数据清洗的完整流程", kind: "PROCEDURE", mastery: 0 },
          { name: "用 Matplotlib 产出可读图表", kind: "PROCEDURE", mastery: 0 },
        ],
      },
      resources: {
        create: [
          {
            title: "Kaggle 高赞数据分析 notebook",
            url: "https://www.kaggle.com",
            type: "OTHER",
            isBenchmark: true,
            notes: "基准资源：对照高手的分析思路与图表标准",
          },
          {
            title: "Pandas 官方文档 Getting Started",
            url: "https://pandas.pydata.org",
            type: "BOOK",
          },
          {
            title: "已购的系统网课",
            type: "COURSE",
          },
        ],
      },
      interviews: {
        create: [
          {
            expert: "老周（数据工程师）",
            content:
              "问：前三个月按什么顺序学？\n答：别先刷语法，直接拿数据做东西，pandas 边用边查。\n问：新手最常走的弯路？\n答：沉迷收藏教程不动手，以及在不重要的图表美化上花太多时间。",
          },
        ],
      },
      checklist: {
        create: PRINCIPLES.flatMap((p) =>
          p.checklist.map((text, i) => ({
            principle: p.order,
            text,
            sortOrder: i,
          })),
        ),
      },
    },
  });

  console.log("✓ 已写入演示项目：Python 数据分析 60 天");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });

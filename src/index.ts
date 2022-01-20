import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const array = [
  "https://komiku.id/manga/koi-wa-iikara-nemuritai/",
  "https://komiku.id/manga/uchi-no-maid-to-kekkon-suru-tamenara-ore-wa-harem-wo-tsukuru/",
];

// "https://komiku.id/manga/kurogane-no-mahoutsukai/"
async function main() {
  await prisma.$connect();
  let xas = await prisma.chapter.findMany({
    include: { data: true },
    where: { title: "Koi wa Iikara Nemuritai!" },
  });

  console.dir(xas, { depth: null });

  for (let i = 0; i < array.length; i++) {
    console.log(i);
    let chapterId: string | undefined;
    let datas: Prisma.ChapterDetailsCreateInput[] = [];

    const { title, data } = await getMangaPage(array[i]);

    const findId = await prisma.chapter.findFirst({
      where: {
        title: title,
      },
    });

    if (!findId?.id) {
      const createId = await prisma.chapter.create({
        data: {
          title: title,
        },
      });
      chapterId = createId.id;
    } else {
      chapterId = findId.id;
    }

    for (let i = 0; i < data.length; i++) {
      let { chapter, url, image } = await getChapterImage(data[i]);
      datas.push({ episode: chapter, url, image });
    }

    await prisma.chapter.update({
      where: { id: chapterId },
      include: { data: true },
      data: {
        data: {
          deleteMany: { chapterId: chapterId },
          createMany: { data: datas },
        },
      },
    });
  }
  console.log("DONE");
  // x.data.forEach(async (y) => {
  //   let data = await getChapterImage(y);
  //   res.push(data);
  // });

  // await prisma.chapter.update({
  //   where: {
  //     id: "61e836b02d62d760f04bc062",
  //   },
  //   data: {
  //     data: {
  //       create: {
  //         data: res,
  //       },
  //     },
  //   },
  // });

  // console.log("DONE");
  // await prisma.chapter.create({
  //   data: {
  //     title: "Isekai",
  //     data: {
  //       create: [
  //         {
  //           episode: "Chapter 1",
  //           url: "Lots of really interesting stuff",
  //           image: ["my-first-post"],
  //         },
  //         {
  //           episode: "Chapter 2",
  //           url: "Lots of really interesting stuff",
  //           image: ["my-first-post"],
  //         },
  //         {
  //           episode: "Chapter 3",
  //           url: "Lots of really interesting stuff",
  //           image: ["my-first-post"],
  //         },
  //       ],
  //     },
  //   },
  // });

  //   const user = await prisma.chapter.findMany({
  //     include: { data: true },
  //     where: { title: "Chapter 3" },
  //   });
  //   let find = await prisma.chapter.findMany({
  //     include: { data: true },
  //     where: { title: "koi wa iikara nemuritai!" },
  //   });

  //   console.dir(find, { depth: null });
  // await prisma.chapter.deleteMany({
  //   where: { title: "" },
  // });

  // const user = await prisma.chapter.update({
  //   where: {
  //     id: "61e8203c3d6bed3394025c2d",
  //   },
  //   data: {
  //     title: "lw",
  //     data: {
  //       createMany: {
  //         data: { episode: "kwok", url: "w" },
  //       },
  //     },
  //   },
  // });

  //   let allUsers = await prisma.chapter.findMany({
  //     include: { data: true },
  //   });

  //   console.dir(allUsers, { depth: null });
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// TRASH
import axios from "axios";
import cheerio from "cheerio";

const baseURL = "https://komiku.id";

interface Chapter {
  title: string;
  data: ChapterData[];
}

interface ChapterData {
  id: number;
  chapter: string;
  url: string;
  image: string[];
}

/**
 * Fetch URL
 * @param url URL string
 * @returns any
 */
async function fetch(url: string): Promise<string> {
  const { data } = await axios.get(url);
  return data;
}

/**
 * Fetch chapter images
 * @param arr Array from `getMangaPage()`
 * @param i first index
 * @param e end of index
 */
async function getChapterImage(arr: ChapterData): Promise<ChapterData> {
  console.log(arr.url, "Loading");

  const result = await fetch(arr.url);
  const $ = cheerio.load(result);

  let images: string[] = $("#Baca_Komik")
    .find("img")
    .toArray()
    .map((element) => $(element).attr("src") || "");
  arr.image = images;

  return arr;
}

async function getMangaPage(url: string): Promise<Chapter> {
  const result = await fetch(url);
  const $ = cheerio.load(result);

  let chapters: Chapter = { title: "Manga", data: [] };
  chapters.title = $("#Judul > h1").text().replace(/\n|\t/g, "");
  $("table > tbody > tr")
    .find(".judulseries > a")
    .toArray()
    .reverse()
    .map((element, id) => {
      let title = $(element);
      chapters.data.push({
        id: id,
        chapter: title.text().replace(/\n|\t/g, ""),
        url: baseURL + title.attr("href"),
        image: [],
      });
    });

  return chapters;
}

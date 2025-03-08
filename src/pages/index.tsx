import styles from "@/styles/Home.module.css";
import dynamic from "next/dynamic";
import { Inter } from "next/font/google";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

const AppWithoutSSR = dynamic(() => import("@/App"), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <title>Dev's Adventure</title>
        <meta
          name="description"
          content="A 2D RPG game where you resolve github issues and earn coins"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <AppWithoutSSR />
      </main>
    </>
  );
}

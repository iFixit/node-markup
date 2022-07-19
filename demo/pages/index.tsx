import type { NextPage } from "next";
import { useRef, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";

const Canvas = (props) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    //Our first draw
    context.fillStyle = "#F00000";
    context.fillRect(0, 0, context.canvas.width / 2, context.canvas.height / 2);
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className={styles.canvas} />
    </>
  );
};

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Image Markup Demo</title>
        <meta name="description" content="Demo Page for ImageMarkup" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>ImageMarkup Demo</h1>

        <Canvas />
      </main>
    </div>
  );
};

export default Home;

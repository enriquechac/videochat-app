import Head from 'next/head'

export default function Home() {
  
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-dark">
      <Head>
        <title>Videochat</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col flex-grow items-center justify-center">
        <div className="flex flex-col bg-dark-light m-8 py-14 px-8 w- w-80 rounded-lg shadow-xl">
          <h4 className="text-white font-light text-xl">Usuario:</h4>
          <input className="bg-dark-light border border-primary outline-none text-white text-center py-1 px-2 text-xl font-light mt-2 mb-4 rounded-md" placeholder="Usuario" type="text" name="" id="" />
          <h4 className="text-white font-light text-xl">Código de la sala:</h4>
          <input className="bg-dark-light border border-primary outline-none text-white text-center py-1 px-2 text-xl font-light mt-2 mb-4 rounded-md" placeholder="Código" type="text" name="" id="" />
          <button className="bg-primary rounded-md text-2xl font-light mt-4 mb-5 shadow-md hover:opacity-70 hover:shadow-lg active:scale-95 transition ease-out">Crear</button>
          <button className="bg-primary rounded-md text-2xl font-light mb-4 shadow-md hover:opacity-70 hover:shadow-lg active:scale-95 transition ease-out">Unirse</button>
        </div>
      </div>
        <p className="mb-4 text-white">Coded by <a className="text-primary hover:opacity-70" href="https://enriquechac.me">enriquechac</a></p>
    </div>
  )
}

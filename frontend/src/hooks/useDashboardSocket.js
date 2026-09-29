import {
  useEffect,
  useRef
} from "react";


// ============================================================
// WEBSOCKET BASE URL
//
// Local development:
//   ws://127.0.0.1:8000
//
// Production:
//   wss://your-backend.onrender.com
//
// Set using:
//   VITE_WS_URL
// ============================================================

const WS_URL =
  import.meta.env.VITE_WS_URL
  || "ws://127.0.0.1:8000";


// ============================================================
// DASHBOARD WEBSOCKET HOOK
// ============================================================

export default function useDashboardSocket(
  onMessage
) {

  const socketRef =
    useRef(null);

  const callbackRef =
    useRef(onMessage);

  const reconnectTimerRef =
    useRef(null);

  const reconnectAttemptsRef =
    useRef(0);

  const manuallyClosedRef =
    useRef(false);


  // ==========================================================
  // KEEP LATEST CALLBACK
  //
  // Prevents unnecessary WebSocket reconnections whenever
  // the consuming component creates a new callback reference.
  // ==========================================================

  useEffect(() => {

    callbackRef.current =
      onMessage;

  }, [
    onMessage
  ]);


  // ==========================================================
  // WEBSOCKET CONNECTION
  // ==========================================================

  useEffect(() => {

    manuallyClosedRef.current =
      false;


    const connect =
      () => {

        // ----------------------------------------------------
        // DO NOT OPEN DUPLICATE CONNECTIONS
        // ----------------------------------------------------

        if (
          socketRef.current
          &&
          (
            socketRef.current.readyState
            === WebSocket.OPEN
            ||
            socketRef.current.readyState
            === WebSocket.CONNECTING
          )
        ) {

          return;

        }


        // ----------------------------------------------------
        // CREATE SOCKET
        // ----------------------------------------------------

        const socket =
          new WebSocket(
            `${WS_URL}/ws/dashboard`
          );


        socketRef.current =
          socket;


        // ----------------------------------------------------
        // OPEN
        // ----------------------------------------------------

        socket.onopen =
          () => {

            console.log(
              "Dashboard WebSocket connected"
            );


            reconnectAttemptsRef.current =
              0;

          };


        // ----------------------------------------------------
        // MESSAGE
        // ----------------------------------------------------

        socket.onmessage =
          (event) => {

            try {

              const message =
                JSON.parse(
                  event.data
                );


              if (
                typeof callbackRef.current
                === "function"
              ) {

                callbackRef.current(
                  message
                );

              }

            } catch (error) {

              console.error(
                "Invalid WebSocket message:",
                error
              );

            }

          };


        // ----------------------------------------------------
        // ERROR
        // ----------------------------------------------------

        socket.onerror =
          (error) => {

            console.error(
              "Dashboard WebSocket error:",
              error
            );

          };


        // ----------------------------------------------------
        // CLOSE
        // ----------------------------------------------------

        socket.onclose =
          () => {

            socketRef.current =
              null;


            if (
              manuallyClosedRef.current
            ) {

              return;

            }


            // ------------------------------------------------
            // RECONNECT WITH BOUNDED BACKOFF
            //
            // 1s, 2s, 4s, 8s, ... max 15s
            // ------------------------------------------------

            reconnectAttemptsRef.current +=
              1;


            const delay =
              Math.min(
                15000,
                1000
                *
                (
                  2
                  **
                  (
                    reconnectAttemptsRef.current
                    - 1
                  )
                )
              );


            reconnectTimerRef.current =
              window.setTimeout(
                () => {

                  connect();

                },
                delay
              );

          };

      };


    // ========================================================
    // START CONNECTION
    // ========================================================

    connect();


    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {

      manuallyClosedRef.current =
        true;


      if (
        reconnectTimerRef.current
      ) {

        window.clearTimeout(
          reconnectTimerRef.current
        );

        reconnectTimerRef.current =
          null;

      }


      if (
        socketRef.current
      ) {

        socketRef.current.close();

        socketRef.current =
          null;

      }

    };

  }, []);


  return socketRef;
}
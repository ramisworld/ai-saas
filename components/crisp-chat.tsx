"use client"

import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web"

export const CrispChat = () => {
    useEffect(() => {
        Crisp.configure("e67c9379-062a-44bb-bb01-6b68dbc32899")
    }, []);

    return null;
}
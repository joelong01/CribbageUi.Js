import util from 'util';
import { StaticHelpers } from './helper_functions';

const HOST_NAME = "https://cribbage.azurewebsites.net/api/"; 
//const HOST_NAME =  "http://localhost:8080/api/";

export class CribbageServiceProxy
{

    //
    //  dealersHand: a boolean that tells the service to optimize for highest crib
    //
    static getHandAsync = async (dealersHand) =>
    {
        let url = HOST_NAME + 'getrandomhand/';
        url += dealersHand ? 'true' : 'false';
        console.log("fetching url: %s", url);
        let res = await fetch(url);
        let jObj = await res.json();
        StaticHelpers.dumpObject("getHandAsync returns:", jObj);
        return jObj;


    }

    static cardArrayToCardNameCsv = (cards) =>
    {
        if (cards.length === 0)
            return "";

        let csv = "";
        for (let card of cards)
        {
            csv += card.state.cardName;
            csv += ",";
        }
        if (csv !== "")
            return csv.slice(0, -1);
        else
            return csv;
    }

    static cutCards = async () =>
    {
        let url = HOST_NAME + "cutcards";
        let res = await fetch(url);
        let jobj = await res.json();
        StaticHelpers.dumpObject("cutCards: ", jobj);        
        return jobj;

    }

    //
    //  hand: the uncounted cards left in the hand
    //  countedCards: the cards that are part of the current counting run
    //  currentCount: the int value of the current count
    static getComputerCountCardAsync = async (hand, countedCards, currentCount) =>
    {


        //URL should look like /getnextcountedcard/:cardsleft/:currentCount/:countedcards
        let url = HOST_NAME + "getnextcountedcard/";

        let csv = CribbageServiceProxy.cardArrayToCardNameCsv(hand);
        url += csv;

        url += "/";
        url += currentCount;

        url += "/";
        csv = CribbageServiceProxy.cardArrayToCardNameCsv(countedCards);

        url += csv;
        console.log("getComputerCountCardAsync url: %s", url);
        let res = await fetch(url);
        let jobj = await res.json();
        return jobj;
    }

    static getCountedScoreAsync = async (inCard, currentCount, countedCards) => // card is a UI card!
    {
        ///scorecountedcards/:playedcard/:currentCount
        // '/scorecountedcards/:playedcard/:currentCount/:countedcards/'
        let url = HOST_NAME + "scorecountedcards/";
        url += inCard.state.cardName;
        url += "/";
        url += currentCount;

        url += "/";

        if (countedCards.length > 0)
        {
            let cards = [];
            for (let card of countedCards)
            {
                if (card.state.cardName !== inCard.state.cardName)
                    cards.push(card);
            }
            let csv = CribbageServiceProxy.cardArrayToCardNameCsv(cards);
            url += csv;
        }
        console.log("getCountedScoreAsync url: %s", url);

        let res = await fetch(url);
        let jObj = await res.json();
        console.log("jObj: %o", jObj);
        return jObj;
    }

    //
    //  hand: an array of 4 CardCtrls
    //  sharedCard: one card
    //  isCrib: a boolean
    //
    static getScoreForHandAsync = async (hand, sharedCard, isCrib) =>
    {
       //  StaticHelpers.dumpObject("getScoreForHandAsync inputs", inObject);

        let url = HOST_NAME + "scorehand/";
        let csv = CribbageServiceProxy.cardArrayToCardNameCsv(hand);
        url += csv;
        url += "/";
        url += sharedCard.state.cardName;
        url += "/";
        url += (isCrib) ? "true" : "false";
        util.log("getScoreForHandAsync url: %s", url);
        let res = await fetch(url);
        let jObj = await res.json();
        return jObj;
    }

    //
    //  hand: an array of cards to get the crib for
    //  isMyCrib: boolean
    //
    //  url: /getcribcards/:hand/:isMyCrib
    //
    static getCribCardsAsync = async (hand, isMyCrib) =>
    {
        let url = HOST_NAME + 'getcribcards/';
        let csv = CribbageServiceProxy.cardArrayToCardNameCsv(hand);
        url += csv;
        url += (isMyCrib) ? "/true" : "/false";

    //    console.log("getCribCards url: %s", url);
        let res = await fetch(url);
        let cribcards = await res.json();
        StaticHelpers.dumpObject("crib cards: ", cribcards);
        return cribcards;
    }

}

export default CribbageServiceProxy;
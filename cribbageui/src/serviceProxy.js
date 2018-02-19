import util from 'util';
import { StaticHelpers } from './helper_functions';

export class CribbageServiceProxy
{

    //
    //  dealersHand: a boolean that tells the service to optimize for highest crib
    //
    static getHandAsync = async (dealersHand) =>
    {
        let returnObject =
            {
                allCards: [],
                computerCrib: [],
                sharedCard: [],
                hisNibs: false,
            };

        try
        {

            let url = 'http://localhost:8080/api/getrandomhand/';
            url += dealersHand ? 'true' : 'false';
            console.log("fetching url: %s", url);
            let res = await fetch(url);
            let jObj = await res.json();
            returnObject.allCards = jObj["RandomCards"];
            returnObject.computerCrib = jObj["ComputerCribCards"];
            returnObject.hisNibs = jObj["HisNibs"];

            for (let serviceCard of returnObject.allCards)
            {
                if (serviceCard.owner === "shared")
                {
                    returnObject.sharedCard = serviceCard;
                    break;
                }
            }

        }
        catch (error)
        {
            util.log("error thrown in GetHandAsync %s", error.message);
        }
        StaticHelpers.dumpObject("getHandAsync returns:", returnObject);
        return returnObject

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
    //
    //  hand: the uncounted cards left in the hand
    //  countedCards: the cards that are part of the current counting run
    //  currentCount: the int value of the current count
    static getComputerCountCardAsync = async (hand, countedCards, currentCount) =>
    {
        let returnObject =
            {
                name: "",
                score: 0
            };

        //URL should look like /getnextcountedcard/:cardsleft/:currentCount/:countedcards
        let url = "http://localhost:8080/api/getnextcountedcard/";

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
        returnObject.name = jobj["countedCard"].name;
        returnObject.score = jobj["Scoring"].Score;
        StaticHelpers.dumpObject("getComputerCountCardAsync returning: ", returnObject);
        return returnObject;
    }

    static getCountedScoreAsync = async (inCard, currentCount, countedCards) => // card is a UI card!
    {
        ///scorecountedcards/:playedcard/:currentCount
        // '/scorecountedcards/:playedcard/:currentCount/:countedcards/'
        let url = "http://localhost:8080/api/scorecountedcards/";
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
        let score = jObj["Score"];
        return score;
    }

    //
    //  hand: an array of 4 CardCtrls
    //  sharedCard: one card
    //  isCrib: a boolean
    //
    static getScoreForHandAsync = async (hand, sharedCard, isCrib) =>
    {
        // /scorehand/:hand/:sharedcard/:isCrib'
        //localhost:8080/api/scorehand/FiveOfHearts,SixOfHearts,FourOfHearts,FourOfClubs/SixOfDiamonds/true 

        let inObject =
            {
                hand: hand,
                sharedCard: sharedCard,
                isCrib: isCrib
            };
        StaticHelpers.dumpObject("getScoreForHandAsyn inputs", inObject);

        let url = "http://localhost:8080/api/scorehand/";
        let csv = CribbageServiceProxy.cardArrayToCardNameCsv(hand);
        url += csv;
        url += "/";
        url += sharedCard.state.cardName;
        url += "/";
        url += (isCrib) ? "true" : "false";
        util.log("getScoreForHandAsync url: %s", url);
        let res = await fetch(url);
        let jObj = await res.json();
        let score = parseInt(jObj["Score"], 10);
        return score;
    }

    //
    //  hand: an array of cards to get the crib for
    //  isMyCrib: boolean
    //
    //  url: /getcribcards/:hand/:isMyCrib
    //
    static getCribCardsAsync = async (hand, isMyCrib) =>
    {
        let url = 'http://localhost:8080/api/getcribcards/';
        let csv = CribbageServiceProxy.cardArrayToCardNameCsv(hand);
        url += csv;
        url += (isMyCrib) ? "/true" : "/false";

        console.log("getCribCards url: %s", url);
        let res = await fetch(url);
        let cribcards = await res.json();
        StaticHelpers.dumpObject("crib cards: ", cribcards);
        return cribcards;
    }

}

export default CribbageServiceProxy;
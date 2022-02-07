import { expect } from "chai"
import { getIdFromRequest } from "../src/helpers"
import { invoice } from "./data"

describe('helpers', ()=> {
  describe('getIdFromRequest', () => {
    it('should return the correct paymentHash from lightning invoice', ()=>{
      const actual = getIdFromRequest(invoice.payreq)
      expect(actual).to.equal(invoice.paymentHash)
    })
  })
})
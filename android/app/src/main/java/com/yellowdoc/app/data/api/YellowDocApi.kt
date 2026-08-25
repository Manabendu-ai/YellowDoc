package com.yellowdoc.app.data.api

import com.yellowdoc.app.data.model.GenerateResponse
import com.yellowdoc.app.data.model.RagAnswer
import okhttp3.MultipartBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Query
import retrofit2.http.Streaming
import retrofit2.http.Url

/**
 * Retrofit definition of the YellowDoc FastAPI surface used by the app.
 */
interface YellowDocApi {

    /**
     * POST /excel/generate?excel_filename=...
     * Uploads a PDF and triggers the docling -> LLM -> Excel pipeline.
     */
    @Multipart
    @POST("excel/generate")
    suspend fun generateExcel(
        @Part file: MultipartBody.Part,
        @Query("excel_filename") excelFilename: String,
    ): Response<GenerateResponse>

    /**
     * POST /query?query=...
     * Asks the RAG pipeline a question over the indexed documents.
     */
    @POST("query")
    suspend fun ask(@Query("query") query: String): Response<RagAnswer>

    /**
     * GET /excel/download/{filename}
     * Streams the generated .xlsx workbook from the server.
     */
    @Streaming
    @GET
    suspend fun downloadFile(@Url url: String): Response<ResponseBody>
}
